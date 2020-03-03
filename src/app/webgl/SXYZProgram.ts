import { SXYZTexture } from './SXYZTexture';

export class SXYZProgram {
    program: WebGLProgram;
    uniforms:object =  {};
    gl: any;//WebGL2RenderingContext;
    vao: any;

    constructor(gl: any, program:WebGLProgram ) {
        this.program = program;
        this.gl = gl;

        const nuni = this.gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
        for (let i=0; i<nuni; i++) {
            const ui = this.gl.getActiveUniform(program, i);
            this.uniforms[ui.name] = { type: ui.type, location: this.gl.getUniformLocation(this.program, ui.name) }
        }

        // the geometry is a single plane made by two triangles.
        const positionLocation = this.gl.getAttribLocation(program, "position");
        const positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
        // 4 2d points
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([-1.0, -1.0,  1.0, -1.0,  -1.0, 1.0,  1.0, 1.0 ]), this.gl.STATIC_DRAW);
        this.vao = this.gl.createVertexArray();
        this.gl.bindVertexArray(this.vao);
        this.gl.enableVertexAttribArray(positionLocation);

        // (location, size of component, type, normalize, stride, offset )
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0)
    }

    uniform(name: string, value: any) {
        this.gl.useProgram(this.program);
        if (this.uniforms[name]) {
            switch (this.uniforms[name].type) {
                case this.gl.FLOAT_VEC2: this.gl.uniform2fv(this.uniforms[name].location, value ); break;
                case this.gl.FLOAT: this.gl.uniform1f(this.uniforms[name].location, value ); break;
                case this.gl.INT: this.gl.uniform1i(this.uniforms[name].location, value ); break;
            }
        } else {
            // no point in setting an uniform that is not active in the program.
            //console.error("The uniform ["+name+"] is not active in the program! ")
        }
        return this;
    }

    texture(name:string, texture: SXYZTexture) {
        this.gl.useProgram(this.program);
        if (this.uniforms[name]) {
            //console.log("setting texture["+name+"] with unit["+texture+"]");
            this.gl.activeTexture(this.gl.TEXTURE0 + texture.unit );
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture.texture );
            this.gl.uniform1i(this.uniforms[name].location, texture.unit );
        } else {
            // no point in setting an uniform that is not active in the program.
            //console.error("The texture ["+name+"] is not active in the program! ")
        }
        return this;
    }


    draw() {
        this.gl.useProgram(this.program);
        // Bind the attribute/buffer set we want.
        this.gl.bindVertexArray(this.vao);
        // ( tri, offset, count )
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }

    destroy() {
        this.gl.deleteProgram(this.program);
    }


}
