import { SXYZTexture } from './SXYZTexture';

export class SXYZFramebuffer {
    framebuffer: WebGLFramebuffer;
    public gl: any;//WebGL2RenderingContext;
    drawBuffers: Array<number> = [];
    fwidth: number = 0;
    fheight: number = 0;

    constructor(gl: any) {
        this.gl = gl;
        this.framebuffer = this.gl.createFramebuffer();
    }

    colorAttachments(textures: Array<SXYZTexture>) {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
        this.drawBuffers = textures.map( (t,i) => this.gl.COLOR_ATTACHMENT0 + i);
        this.gl.drawBuffers(this.drawBuffers);
        this.fwidth = textures[0].width();
        this.fheight = textures[0].height();
        textures.forEach( (t,i) => {
            this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0 + i, this.gl.TEXTURE_2D, t.texture, 0)
        })
    }

    width(): number {
        return this.fwidth;
    }

    height(): number {
        return this.fheight;
    }

    readPixels(channels:number = 4, attach:number = 0): Float32Array {
        this.gl.readBuffer(this.gl.COLOR_ATTACHMENT0 + attach);
        const data = new Float32Array(this.fwidth*this.fheight*channels);
        const format = channels == 1 ? this.gl.RED : channels == 2 ? this.gl.RG : channels == 3 ? this.gl.RGB : this.gl.RGBA;
        this.gl.readPixels(0, 0, this.fwidth, this.fheight, format, this.gl.FLOAT, data);
        return data;
    }

    clear() {
        this.gl.viewport(0, 0, this.fwidth, this.fheight);

        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

    destroy() {
        this.gl.deleteFramebuffer(this.framebuffer);
    }

}
