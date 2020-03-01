
export class Shader {
    id: string;
    uid: string;
    author: string;
    photoURL: string;
    source: Array<string>;
    edit: number;
    inputs: { audio: boolean, video: boolean };
    buffers: { audio: boolean, state: boolean };
    tags: Array<string>;
    animate: boolean;
    scale: number;
    title: string;
    description: string;
    screenshot: string;
    updatedAt: any;
    createdAt: any;
    
    public constructor(init?:Partial<Shader>) {
        Object.assign(this, init);
    }    
}