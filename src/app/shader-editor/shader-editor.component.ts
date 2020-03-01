import { Component, Directive, OnInit, ViewChild, ElementRef, AfterViewInit,Inject, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, Observable, of, interval } from "rxjs";
import { pairwise, map, switchMap, take } from "rxjs/operators";
import { OGLService } from "../ogl.service"
import { Shader } from "../shader"; 
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FireService } from '../fire.service';
import { AuthService } from '../auth.service';
declare let ace: any;

@Component({
  selector: 'app-shader-editor',
  templateUrl: './shader-editor.component.html',
  styleUrls: ['./shader-editor.component.scss']
})
export class ShaderEditorComponent implements OnInit, AfterViewInit { 

    @ViewChild("canvas",{static:true}) public canvas: ElementRef;
    @ViewChild("container",{static:true}) public container: ElementRef;
    @ViewChild("editor",{static:false}) public editor: any;

    options:any = { printMargin: false };

    model : any;
    shaderSubject: BehaviorSubject<Shader>;
    shader: Shader; 
    errors: Array<any> = [];
    dirty: boolean = false;
    resolution: string = "";
    showCode: boolean = true;
    fps: Observable<number>;
    user: any;
    viewMode: boolean;
    tabs: Array<any> = [];
    source: string;
    

    constructor(
        private ogl: OGLService,
        private fireService: FireService,
        private auhtService: AuthService,
        private route: ActivatedRoute, 
        private router: Router,
        private dialog: MatDialog) { 

        this.fps = this.ogl.fps();
        this.shader = new Shader({ 
                    title: "New Shader",
                    description: "...",
                    tags: [],
                    scale: 1,
                    edit: 0,  
                    animate: true,
                    inputs: { audio: false, video: false },
                    buffers: {audio: false, state: false },
                    source: [this.ogl.defaultProgram().fs,this.ogl.defaultProgram().ss,this.ogl.defaultProgram().as]
                });
    }

    ngOnInit() {
        this.route.url.subscribe( r => {
            this.viewMode = r[1].path === "view" 
            if (!this.viewMode) interval(30000).subscribe( a => { if (this.dirty && this.errors.length == 0) { this.save(); }} ); // save if there are no compile errors 
            this.showCode = !this.viewMode;
        });
        this.auhtService.user$.subscribe( user => { this.user = user }); 

        this.route.paramMap.pipe(
            switchMap( params => {
                let id = params.get("id");
                return id === "new" ? of(this.shader) : this.fireService.docWithId$("shaders/"+id);
            }),
            take(1)
        ).subscribe( s => {  
            this.shader = {...s};
            this.shader.inputs = {...s.inputs};
            this.shader.buffers = {...s.buffers};
            this.tabs.push({ name:"Main", icon: "video_library", active: true, buffer: 0});
            if (s.buffers.state) this.tabs.push({ name:"State", icon: "video_label", active: false, buffer: 1});
            if (s.buffers.audio) this.tabs.push({ name:"Sound", icon: "music_video", active: false, buffer: 2}); 
            console.log("init...");
            this.shaderSubject = new BehaviorSubject(this.shader);  
            this.canvas.nativeElement.width = this.container.nativeElement.clientWidth;
            this.canvas.nativeElement.height = this.container.nativeElement.clientHeight;   
            this.resolution = this.canvas.nativeElement.width + "x" + this.canvas.nativeElement.height;
            this.ogl.config(this.canvas.nativeElement, this.shaderSubject.asObservable() );
        });

        const Range = ace.require('ace/range').Range;
        this.ogl.compileErrors()
        .pipe( 
            map( dbg => dbg.errors.map( e => ({...e, row: e.line-dbg.padding, column: 0, type: "error" }) )),
            pairwise() )
        .subscribe( errors => {
            if (this.editor) {
                this.errors = errors[1]; 
                //this.editor.getEditor().getSession().addMarker(new Range(2, 0, 27, 1), "errorLine", "fullLine");
                // previous errors
                /*
                errors[0].forEach( e => {
                    this.editor.getEditor().getSession().removeGutterDecoration(e.row,"errorSignal");
                });
                */
                this.editor.getEditor().getSession().clearAnnotations();
                /*
                errors[1].forEach( e => {
                    this.editor.getEditor().getSession().addGutterDecoration(e.row,"errorSignal");
                });
                */
                this.editor.getEditor().getSession().setAnnotations(errors[1]);
            }
        });
    }

    ngAfterViewInit() {  
    // Load the model.
        //this.model = await mobilenet.load({version: 2, alpha: 1.0});
    }

    activeTab(i, buffer) {
        console.log("active tab");
        this.tabs = this.tabs.map( t => ({...t, active: false}) );
        this.shader.edit = buffer;
        this.tabs[i].active = true;
    }

    fullScreen() {
        if (this.container.nativeElement.requestFullscreen) this.container.nativeElement.requestFullscreen();
    }

    showErrors() {
        const dialogRef = this.dialog.open(ShowErrorsDialog,{ data: this.errors }); 
    }

    showProperties() {
        const dialogRef = this.dialog.open(PropertiesDialog,{ data: this.shader }); 
        dialogRef.afterClosed().subscribe(result => { 
            this.save(); 
            this.tabs = []; 
            this.tabs.push({ name:"Main", icon: "video_library", active: true, buffer: 0});
            if (this.shader.buffers.state) this.tabs.push({ name:"State", icon: "video_label", active: false, buffer: 1});
            if (this.shader.buffers.audio) this.tabs.push({ name:"Sound", icon: "music_video", active: false, buffer: 2}); 

            this.shaderSubject.next(this.shader) 
        });
    }

    showUser() {

        /*

        It was a simple test to synth real time audio, with the web audio api, but I realised that mixing the screen generation and audio generation
        is not a good idea... one is generated in space x,y another is generated in time and the two are fundamentally different.

        The idea could be to generate two shaders buffers, or else the generation of the sound would have to be repeated 60 fps! bad...

        Then we return to several buffers for a piece.

        let audioContext =  new (window['AudioContext'] || window['webkitAudioContext'])();
        // stereo
        // mono


        */

        const dialogRef = this.dialog.open(UserDialog);

        dialogRef.afterClosed().subscribe(result => {
            console.log(`Dialog result: ${result}`); 
        });
    }


    save() {
        this.shader.screenshot = this.canvas.nativeElement.toDataURL(); 
        this.shader.uid = this.user.uid;
        this.shader.author = this.user.isAnonymous ? "Anonymous" : this.user.displayName; 
        this.shader.photoURL = this.user.photoURL;
        if (this.shader.id) {
            let id = this.shader.id;
            //delete this.shader.id;
            this.fireService.set("shaders/"+ id, this.shader ).then(
                (value) => { this.dirty = false },
                (error) => { console.log("error: ", error)  }
            );
        } else {
            this.fireService.add("shaders", this.shader ).then(
                (value) => { 
                    this.shader.id = value.id; 
                    window.history.replaceState({},'',"/xyz/editor/"+this.shader.id);
                    this.dirty = false;
                },
                (error) => { console.log("error: ", error); }
            );
        }
        
    }

    fork() {
        console.log("fork")
        this.fireService.add("shaders", this.shader ).then(
            (value) => { 
                this.shader.id = value.id; 
                this.router.navigateByUrl("/xyz/editor/"+this.shader.id); 
            },
            (error) => { console.log("error"); console.log(error); }
        );
    }

    setScale(scale) {
        this.shader.scale = scale;
        this.resolution = (window.innerWidth/scale) + "x" + (window.innerHeight/scale);
        this.shaderSubject.next(this.shader);
        this.dirty = true;
    }

    onChange(source) {
        this.dirty = true;
        this.shader.source[this.shader.edit] = source; 
        console.log("text changed...");
        this.shaderSubject.next(this.shader);
        //console.log(source);
    }

    togglePlay() {
        this.shader.animate = !this.shader.animate;
        this.shaderSubject.next(this.shader);
        this.dirty = true;
    }

    toggleCode() {
        this.showCode = !this.showCode;
    }

}

@Component({
  selector: 'properties-dialog',
  templateUrl: 'properties-dialog.html',
  styleUrls: ['./shader-editor.component.scss']
})
export class PropertiesDialog {

    public constructor(public dialogRef: MatDialogRef<PropertiesDialog>, @Inject(MAT_DIALOG_DATA) public shader: Shader) {}

    close() { 
        console.log("close properties");
        this.dialogRef.close();
    }
    
}
 
@Component({
  selector: 'user-dialog',
  templateUrl: 'user-dialog.html',
  styleUrls: ['./shader-editor.component.scss']
})
export class UserDialog {
    constructor(public dialogRef: MatDialogRef<UserDialog>, private router: Router) {}

    signOut() {
        this.router.navigate(["/"]);
        this.dialogRef.close();
    }
} 

@Component({
  selector: 'show-errors',
  templateUrl: 'show-errors.html',
  styles: ['./shader-editor.component.scss'],
})
export class ShowErrorsDialog {

    public constructor(public dialogRef: MatDialogRef<ShowErrorsDialog>, @Inject(MAT_DIALOG_DATA) public errors: Array<any>) {}

    close() { 
        console.log("close erros");
        this.dialogRef.close();
    }

}