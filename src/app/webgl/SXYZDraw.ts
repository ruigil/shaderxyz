import { SXYZContext } from "./SXYZContext";
import { SXYZFramebuffer } from "./SXYZFramebuffer";
import { SXYZProgram } from "./SXYZProgram";
import { SXYZTexture } from "./SXYZTexture";

export class SXYZDraw {
    context: SXYZContext;
    gl: WebGL2RenderingContext;
    fbuffer: SXYZFramebuffer = null;
    prog: SXYZProgram;
    uniforms: Object = {};
    textures: Object = {};

    constructor(context: SXYZContext ) {
        this.gl = context.gl;
    }

    framebuffer( fbuffer: SXYZFramebuffer) {
        this.fbuffer = fbuffer;
        return this;
    }

    program( program: SXYZProgram ) {
        if (this.prog) this.prog.destroy();
        this.prog = program;
        Object.entries(this.uniforms).forEach( ([key, value]) => this.prog.uniform(key,value) );
        Object.entries(this.textures).forEach( ([key, value]) => this.prog.texture(key,value) );
        return this;
    }

    uniform( name: string, value: any) {
        this.uniforms[name] = value;
        if (this.prog) this.prog.uniform(name,value);
        return this; 
    }

    texture( name: string, value: SXYZTexture) {
        this.textures[name] = value;
        //console.log(`draw texture ${name}`);
        if (this.prog) this.prog.texture(name,value);
        return this;
    }

    draw() {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbuffer.framebuffer);
        this.gl.viewport(0, 0, this.fbuffer.width(), this.fbuffer.height());

        this.fbuffer.clear();
 
        this.prog.draw(); 
    }
    
    destroy() {
        this.fbuffer.destroy();
        this.prog.destroy();
    }
}
