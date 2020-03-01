import { Injectable } from '@angular/core';
import { Observable, fromEvent, combineLatest, BehaviorSubject, interval, Subscription } from "rxjs";
import { take, debounceTime, throttleTime, pairwise, map, filter, skip } from "rxjs/operators"; 
import * as bodyPix from '@tensorflow-models/body-pix';
import { Shader } from "./shader";

import { SXYZContext } from './webgl/SXYZContext';
import { SXYZProgram } from './webgl/SXYZProgram';
import { SXYZFramebuffer } from './webgl/SXYZFramebuffer';
import { SXYZTexture } from './webgl/SXYZTexture';
import { SXYZDraw } from './webgl/SXYZDraw';


class Timer {
    static st:number = 0;
    
    static start = () => Timer.st = Date.now();
    static reset = () => Timer.st = 0;
    static elapsed = () => Date.now() - Timer.st; 
}

const defaultProgram:any = {
    vs: 
`#version 300 es

precision highp float;

in vec4 position;
uniform vec2 resolution;

// a varying to pass the texture coordinates to the fragment shader
out vec2 tex;
out vec2 ref;

void main() {
    gl_Position = position;
    tex = (position.xy + vec2(1.)) * vec2(.5); 
    ref = (position.xy *  resolution.xy ) / resolution.y ; // aspect ratio
}`,
    
    fs: 
`

/*

    inputs: {
        vec2 tex: texel from 0 on the lower left corner to 1 on the upper right corner
        vec2 ref: coordinate reference frame, with corrected aspect ratio, centered, from -1, to 1
        vec2 mouse: normalised coordinates of mouse from 0 on the lower left to 1 on the upper right
        float ftime: frame time, in seconds
        int frame: frame number
        sampler2D video: if webcam active 640x480 texture with the webcam video source
        sampler2D audio: if micro active 512x512 texture with the spectrogram of the microphone
        sampler2D state: if state buffer, than screen resolution float texture, with the state buffer computation
    }
    
*/

out vec4 oPixel;

void main() { 
    oPixel = vec4( abs(ref.x), abs(ref.y),  smoothstep( .01,.0, length(ref)-((1.+sin(mod(ftime,6.28)))*.5)-.1), 1. );
}`,

    ss:
`

/*

    inputs: {
        tex: vec2, texel from 0 on the lower left corner to 1 on the upper right corner
        ref: vec2, coordinate reference frame, with corrected aspect ratio, centered, from -1, to 1
        mouse: vec2, normalised coordinates of mouse from 0 on the lower left to 1 on the upper right
        ftime: float, frame time, in seconds
        frame: int, frame number
     if video: sampler2D, 640x480 texture with the webcam video source
     if audio: sampler2D, 512x512 texture with the spectrogram of the microphone
     if state: sampler2D, screen resolution float texture, for generic data storage. See output oState
    }

*/

out vec4 oState;

void main() {
    oState = vec4( 0.);
}`,

    as:
`
/*
    // audio is pre rendered in a 60 seconds loop.
    inputs: {
        float stime; // sample time.
        float sampleRate; // sample rate.
    }

*/
// 2 channels left and right, with values between -1 and 1.
out vec2 oSound;

void main() {
    oSound = vec2( 0.);
}`
}

@Injectable({
  providedIn: 'root' 
})
export class OGLService {
    resolution: Float32Array = new Float32Array( [0.0,0.0] );
    size: Float32Array = new Float32Array( [0.0,0.0] );
    mouse: Float32Array = new Float32Array( [0.0,0.0] );

    io: Array<string> = [
        "#version 300 es",
        "precision highp float;",
        "in vec2 tex;",
        "in vec2 ref;",
        "uniform vec2 resolution;",
        "uniform vec2 mouse;",
        "uniform float ftime;",
        "uniform float sampleRate;",
        "uniform int frame;",
        "#define coord ivec2(gl_FragCoord.xy)",
        "#define stime (floor(gl_FragCoord.x + (gl_FragCoord.y * resolution.x)) / sampleRate)"
    ]

    isAnimate: boolean = false;
    frame: number = 0;

    webcam: any;
    spectro: any; 
    spectroData: Uint8Array = new Uint8Array(512*512*4);
    video: any; 
    analyser: any;
    fftData: Uint8Array; 
    animation: any;
    canvas: any;
    hasVideo: boolean = false;
    hasAudio: boolean = false;
    audioBuffer: any;
    sound: SXYZTexture;
    audioContext: any;

    errorsSubject = new BehaviorSubject({ errors: [], padding: 0}); 
    shader: Shader;
    
    context: SXYZContext;
    draw: Array<SXYZDraw> = [];
    offscreen: SXYZFramebuffer;
    wFrameBuf: SXYZFramebuffer;
    rFrameBuf: SXYZFramebuffer;
    audioFram: SXYZFramebuffer;
    //offs: SXYZTexture;
    prev: SXYZTexture;
    next: SXYZTexture;

    width: number;
    height: number;
    scale: number;

    net: any;
    soundnode: any;

    constructor() { }

    async config(canvas, shader) {

        this.width = canvas.width;
        this.height = canvas.height;
        this.context = new SXYZContext(canvas);
        this.scale = 0;
        this.shader = null;

        this.draw[0] = new SXYZDraw(this.context);
        this.draw[1] = new SXYZDraw(this.context);
        this.draw[2] = new SXYZDraw(this.context);
        //this.net = await bodyPix.load(/** optional arguments, see below **/);

        
        //this.draw.program(this.context.createProgram(defaultProgram)) 
        //.texture("video",this.webcam) 
        //.texture("audio",this.spectro);
        
        fromEvent(window, 'deviceorientation').subscribe( (e:Event) => {
            //console.log(e);  
            /**
            alpha - 
            beta -
            gamma - 
             */
        });

        fromEvent(window, 'devicemotion').subscribe( (e:Event) => {
            //console.log(e);
        });

        fromEvent(canvas, 'mousemove').subscribe( (e:MouseEvent) => {
            this.mouse[0] = e.clientX / this.resolution[0]; 
            this.mouse[1] = e.clientY / -this.resolution[1]; 
            this.draw.forEach( d => d.uniform("mouse", this.mouse ));
        });

        fromEvent(window, 'resize').pipe( debounceTime(1000) ).subscribe( (e:Event) => {
            this.width = canvas.clientWidth;
            this.height = canvas.clientHeight;
            this.initFramebuffers(this.shader,this.width / this.shader.scale, this.height / this.shader.scale); 
            this.setScale(this.shader.scale); 
            if (!this.shader.animate) this.render();
        });

        // video
        shader.pipe( filter((s:Shader) => navigator.mediaDevices && navigator.mediaDevices.getUserMedia && s.inputs.video && !this.hasVideo ))
        .subscribe( s => {
            this.video = document.createElement("video"); 
            this.video.width = 640; 
            this.video.height = 480;
            this.video.style.cssText = "-moz-transform: scale(-1, -1); -webkit-transform: scale(-1, -1); -o-transform: scale(-1, -1); transform: scale(-1, -1);";
            this.webcam = this.context.createTexture("video", 640, 480);
            this.draw.forEach( d => d.texture("video",this.webcam));
            navigator.mediaDevices.getUserMedia({video: {width: {exact: 640}, height: {exact: 480}}} ).then( stream => { 
                this.video.srcObject = stream; 
                this.video.play();    
            });
            combineLatest(fromEvent(this.video,"playing"),fromEvent(this.video,"timeupdate"))
            .pipe(take(1)).subscribe( ([p,t]) => { this.hasVideo = true; });
        });

        // audio 
        shader.pipe(filter((s:Shader) => navigator.mediaDevices && navigator.mediaDevices.getUserMedia && s.inputs.audio && !this.hasAudio ))
        .subscribe( (s:Shader) => {
            navigator.mediaDevices.getUserMedia({ audio: true }).then( stream => {
                this.audioContext =  new (window['AudioContext'] || window['webkitAudioContext'])();

                this.analyser = this.audioContext.createAnalyser();
                this.audioContext.createMediaStreamSource(stream).connect(this.analyser);
                this.analyser.fftSize = 1024;
                this.fftData = new Uint8Array(512);
                this.spectro = this.context.createTexture("audio", 512, 512);
                this.draw.forEach( d => d.texture("audio",this.spectro)); 
                this.hasAudio = true;
            });
        });
        
        // audio output generation
        shader.pipe(filter((s:Shader) => s.buffers.audio && s.animate))
        .subscribe( (s:Shader) => {
            if (this.soundnode) this.soundnode.stop();
            console.log("generate audio")
            this.audioContext =  new (window['AudioContext'] || window['webkitAudioContext'])();
            const bufferSize = 200*240;//this.audioContext.sampleRate * 2; // 60 seconds only...
            
            if (this.sound) this.sound.destroy();
            if (this.audioFram) this.audioFram.destroy();
            this.sound = this.context.createTexture("sound", 200, 240, { internalFormat: this.context.gl.RG32F, format: this.context.gl.RG, type: this.context.gl.FLOAT } );
            this.audioFram = this.context.createFrameBuffer( [ this.sound ] ); 
            this.draw[2]
                .framebuffer(this.audioFram)
                .program(this.context.createProgram({ vs: defaultProgram.vs, fs: this.io.join("\n") + s.source[2] }) ) 
                .uniform("sampleRate", this.audioContext.sampleRate)
                .uniform("resolution", new Float32Array([200,240]) )
                .draw();

            console.log("sample rate ", this.audioContext.sampleRate);
            console.log("buffersize x2 channels", bufferSize * 2); 
            let audioBuffer = this.audioContext.createBuffer(2, bufferSize, this.audioContext.sampleRate);
            let audioData = this.audioFram.readPixels(2); // 2 channels stereo
            console.log(audioData);
            let canal0 = audioBuffer.getChannelData(0); 
            let canal1 = audioBuffer.getChannelData(1);
            console.log("*generate audio*");
            for (var i = 0; i < bufferSize; i++) {
                // Math.random() est compris entre [0; 1.0]
                // audio doit être compris entre [-1.0; 1.0]
                // C4 = 261 hz
                // A4 = 440 hz
                // sample rate  = 48000 second
                // sample = 48000 / 261
                //canal0[i] = Math.sin( (440. / this.audioContext.sampleRate) * 2.*3.1415 * i);
                //canal1[i] = Math.sin( (261. / this.audioContext.sampleRate) * 2.*3.1415 * i);
                canal0[i] = audioData[i*2];
                canal1[i] = audioData[i*2 + 1];
            }                
            console.log("*generated...*");

            this.soundnode = this.audioContext.createBufferSource();
            this.soundnode.buffer = audioBuffer;
            this.soundnode.loop = true;
            this.soundnode.connect(this.audioContext.destination);
            this.soundnode.start();
        });

        shader.subscribe( s => {
            console.log("update...");
            let prefix = this.io;

            prefix = s.inputs.video ? prefix.concat(["uniform sampler2D video;"]) : prefix;
            prefix = s.inputs.audio ? prefix.concat(["uniform sampler2D audio;"]) : prefix;
            prefix = s.buffers.state ? prefix.concat(["uniform sampler2D state;"]) : prefix;

            if (!this.shader) {
                console.log("initialize...");
                this.shader = {...s}; // shallow copy one level
                this.shader.inputs = {...s.inputs};
                this.shader.buffers = {...s.buffers};
                this.initFramebuffers( s, this.width / s.scale, this.height / s.scale ); 
                this.draw.forEach( (d,i) => d.program(this.context.createProgram({ vs: defaultProgram.vs, fs: prefix.join("\n") + s.source[i] }) ));
                this.setScale(s.scale);
            }

            if (this.shader.animate != s.animate) {
                console.log(`animate...${s.animate}`);
                this.shader.animate = s.animate;
                if (!s.animate && this.soundnode) this.soundnode.stop();
            }

            if (this.shader.scale != s.scale) {
                console.log("rescale...");

                this.shader.scale = s.scale;
                //this.initFramebuffers(this.shader, this.width / this.shader.scale, this.height / this.shader.scale);
                //this.draw.forEach( (d,i) => d.program(this.context.createProgram({ vs: defaultProgram.vs, fs: prefix.join("\n") + s.source[i] }) ));
                this.initFramebuffers( s, this.width / s.scale, this.height / s.scale);  
                this.setScale(s.scale);
            }

            // rethink the whole process of change management            
            if (this.shader.buffers.state != s.buffers.state) {
                console.log("init state buffer");
                this.initFramebuffers( s, this.width , this.height );
                this.shader.buffers.state = s.buffers.state;
            }


            //const errors = this.context.compile(prefix.join("\n") + s.source[s.edit]);
            const pad = prefix.length;
            const debug = { errors: this.context.compile(prefix.join("\n") + s.source[s.edit]), padding: pad }
            this.errorsSubject.next(debug);

            if (debug.errors.length == 0) {
                console.log("redraw...");
                if (s.animate) cancelAnimationFrame(this.animation);
                this.draw[s.edit].program( this.context.createProgram({ vs: defaultProgram.vs, fs: prefix.join("\n") + s.source[s.edit] }) )
                this.frame = 0;
                Timer.start();
                this.render();
            }
        }); 


   }

   setScale(scale:number) {
        this.context.gl.canvas.width = this.width / scale;
        this.context.gl.canvas.height = this.height / scale;
        this.resolution[0] = this.width / scale; 
        this.resolution[1] = this.height / scale;  
        this.draw.forEach(d => d.uniform("resolution", this.resolution));
   }
    
    async predict() {

    /**
        * One of (see documentation below):
        *   - net.segmentPerson
        *   - net.segmentPersonParts
        *   - net.segmentMultiPerson
        *   - net.segmentMultiPersonParts
        * See documentation below for details on each method.
        */
        const segmentation = await this.net.segmentPerson(this.video);
        console.log(segmentation);
    }

    private initFramebuffers(shader, width, height) {
        const floatTexture = { internalFormat: this.context.gl.RGBA32F, format: this.context.gl.RGBA, type: this.context.gl.FLOAT };  
            
        console.log(`resolution initframe ${width} ${height}`);
        if (this.prev) this.prev.destroy();
        if (this.next) this.next.destroy();

        if (this.offscreen) this.offscreen.destroy();
        if (this.rFrameBuf) this.rFrameBuf.destroy(); 
        if (this.wFrameBuf) this.wFrameBuf.destroy();

        if (shader.buffers.state) {
            this.prev = this.context.createTexture("previous", width, height, floatTexture ); 
            this.next = this.context.createTexture("nextstate", width, height, floatTexture ); 
            this.wFrameBuf = this.context.createFrameBuffer( [ this.next ] ); 
            this.rFrameBuf = this.context.createFrameBuffer( [ this.prev ] );
            this.draw.forEach( d => d.texture("state", this.prev));
            this.draw[1].framebuffer(this.wFrameBuf);
        }

        this.offscreen = this.context.createFrameBuffer( [ this.context.createTexture("offscreen", width, height) ] ); 
        this.draw[0].framebuffer(this.offscreen);
    }

    private updateSpectro() {
        if (this.analyser) {
            this.spectroData.copyWithin(512*4,0,511*4*512);
            this.analyser.getByteFrequencyData(this.fftData); 
            for (let i=0; i<512; i++) this.spectroData[i*4] = this.fftData[511-i%512];
        }
        return this.spectroData;
    }    

    private render() {

        if (this.hasVideo) this.webcam.data(Promise.resolve(this.video)); 

        if (this.hasAudio) this.spectro.data(Promise.resolve(this.updateSpectro()), 512, 512);

        if (this.shader) {
            if (this.shader.buffers.state) {
                this.draw[1]
                    .uniform("ftime", Timer.elapsed() / 1000)
                    .uniform("frame", this.frame)
                    .draw();
                this.context.copyFramebuffer(this.wFrameBuf,this.rFrameBuf, 0);
            }

            this.draw[0]
                .uniform("ftime", Timer.elapsed() / 1000)
                .uniform("frame",this.frame++)
                .draw();
            this.context.copyFramebuffer(this.offscreen,null);


            if (this.shader.animate) this.animation = requestAnimationFrame( this.render.bind(this) ); 
        }

    }

    defaultProgram() { return defaultProgram; }
 
    compileErrors(): Observable<any> { 
        return this.errorsSubject.asObservable();
    }

    fps(): Observable<any> {  
        return interval(1000).pipe( map( t => this.frame ), pairwise(), map( p => p[1] - p[0] ), filter( n => n >= 0) ) 
    }

    ngDestroy() { 
        this.draw.forEach( d => d.destroy() );
    }


}
 