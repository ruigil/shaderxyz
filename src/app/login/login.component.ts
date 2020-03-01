import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { AuthProcessService } from 'ngx-auth-firebaseui';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import {
    AngularFirestore,
    AngularFirestoreDocument
} from '@angular/fire/firestore';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
    user$ : Observable<any>;

  constructor(private auth: AuthProcessService,private afs: AngularFirestore, private router: Router) { 
      //auth2.handleSuccess().then()
      //auth.user$.subscribe( user => user ? console.log(user.email) : console.log("login") );      
      //auth2.afa.authState.subscribe( user => console.log(user) );
      this.user$ = this.auth.afa.authState.pipe( 
          switchMap(user => {
              console.log(user);
              return of(user);
          }
      ));
 }

  ngOnInit() {
  }

  loggedIn(event) {
      console.log("logged in success");
      this.router.navigate(["/xyz/editor/new"])
      console.log(event);
  }

  authError() {
      console.log("error auth");
  }

  printError() {
      console.log("error not logged");
  }

  printUser(user) {
      console.log("user:");
      console.log(user);
  }

}
