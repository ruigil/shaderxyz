
import { SXYZTexture } from './SXYZTexture';
import { SXYZProgram } from './SXYZProgram';
import { SXYZFramebuffer } from './SXYZFramebuffer';

export class SXYZContext {
    public gl: WebGL2RenderingContext;
    video: HTMLVideoElement;
    textureUnits: Object = {}; 
    unit: number = 0;
    previous: SXYZTexture;
    next: SXYZTexture;
    offscreen: SXYZTexture;
    frameb: WebGLFramebuffer;
    copyfb: WebGLFramebuffer;

    constructor(canvas: any) {
        this.gl = canvas.getContext("webgl2", { antialias: false, preserveDrawingBuffer: true } ); 
        if (!this.gl) throw new Error("NO WEBGL2 DETECTED!");  
        if (!this.gl.getExtension("EXT_color_buffer_float")) {
            console.log("NO floating point textures !"); 
        }
    }

    createFrameBuffer( attachments?: Array<SXYZTexture>): SXYZFramebuffer {
        const frame = new SXYZFramebuffer(this.gl) ;
        if (attachments) {
            frame.colorAttachments(attachments);
        }
        return frame;
    }

    copyFramebuffer( source: SXYZFramebuffer, dest: SXYZFramebuffer, srcPoint: number = 0) {
        this.gl.readBuffer(this.gl.COLOR_ATTACHMENT0 + srcPoint );  
        this.gl.bindFramebuffer(this.gl.READ_FRAMEBUFFER, source.framebuffer); 
        this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, dest ? dest.framebuffer : null);
        this.gl.blitFramebuffer(0,0,this.gl.canvas.width,this.gl.canvas.height,0,0,this.gl.canvas.width,this.gl.canvas.height,this.gl.COLOR_BUFFER_BIT, this.gl.NEAREST);
    }

    createProgram(programSource) {
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, programSource.vs);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, programSource.fs);
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        const success = this.gl.getProgramParameter(program, this.gl.LINK_STATUS);
        if (success) {
            return new SXYZProgram(this.gl, program);
        };
        this.gl.deleteProgram(program);
    }
    
    private createShader(type, source) {
        var shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        var success = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
        if (success) {
            return shader;
        }
        console.log(this.gl.getShaderInfoLog(shader));
        this.gl.deleteShader(shader);
    }    

    public compile(source):Array<any> {
        const errors: Array<{ line: number, text: string }> = []; 
        const shader = this.gl.createShader(this.gl.FRAGMENT_SHADER);

        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {

            let lines = this.gl.getShaderInfoLog(shader).split('\n');
            
            for (let i = 0; i < lines.length-1; ++i) {
                let ns = lines[i].substring(9);
                let error = { line: Number(ns.substring(0,ns.indexOf(":"))), text: ns.substring(ns.indexOf(":")+2) }
                errors.push(error);
            }
        }
        return errors;
    }

    createTexture(name: string, width: number = 1, height: number = 1, options?: any) {
        if (!this.textureUnits[name]) this.textureUnits[name] = this.unit++;
        return new SXYZTexture(this.gl, this.textureUnits[name], width, height, options);
    }
    
}
