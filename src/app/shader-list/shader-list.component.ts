import { Component, OnInit, HostListener } from '@angular/core';
import { FireService } from '../fire.service';
import { AuthService } from '../auth.service';
import { Shader } from '../shader';
import { Observable } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-shader-list',
  templateUrl: './shader-list.component.html',
  styleUrls: ['./shader-list.component.scss']
})
export class ShaderListComponent implements OnInit {
  shader$: Observable<Shader[]>;
  user: any;
 

  constructor( private fireService: FireService, authService: AuthService, private snackbar: MatSnackBar ) { 
      this.shader$ = fireService.colWithIds$<Shader[]>("shaders", ref => ref.orderBy("createdAt","desc") );
      authService.user$.subscribe( user => {this.user = user; console.log(this.user.photoURL)});
  }

  ngOnInit() {
  }

  delete(shader) {
    this.fireService.delete("shaders/"+shader.id).then(
        (value) => { this.snackbar.open("Shader Deleted !","OK") },
        (error) => { this.snackbar.open(error,"OK") }
    );
  }

}
