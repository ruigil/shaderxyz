export class SXYZTexture {
    texture: WebGLTexture;
    gl: WebGL2RenderingContext; 
    unit: number;
    options: any;
    tWidth: number;
    tHeight: number;

    constructor(gl: WebGL2RenderingContext, unit:number, width: number, height: number, opt?: any) { 
        // Create a texture.
        this.unit = unit;
        this.gl = gl;
        this.tWidth = width;
        this.tHeight = height;
        this.options = opt || { internalFormat: this.gl.RGBA, format: this.gl.RGBA, type: this.gl.UNSIGNED_BYTE };
        this.texture = this.gl.createTexture();
        this.gl.activeTexture(this.gl.TEXTURE0 + this.unit); 
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        
        // Set the parameters so we can render any size image.
        this.gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); 
        this.gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        let source = this.options.type === this.gl.FLOAT ? new Float32Array(width*height*4) : new Uint8Array(width*height*4);

        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.options.internalFormat, width, height, 0, this.options.format, this.options.type, source );
    }

    data(data: Promise< HTMLImageElement | HTMLVideoElement | Uint8Array | Float32Array >) { 
        data.then( (d:any) => {
            this.gl.activeTexture(this.gl.TEXTURE0 + this.unit);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture );
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.options.internalFormat, this.tWidth, this.tHeight, 0, this.options.format, this.options.type, d); 
        });
    }

    width() : number { 
        return this.tWidth; 
    }
    
    height() : number { 
        return this.tHeight; 
    }

    destroy() {
        this.gl.deleteTexture(this.texture); 
    }

}
