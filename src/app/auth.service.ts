import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { auth } from 'firebase/app';
import { AngularFireAuth } from '@angular/fire/auth';
import {
    AngularFirestore,
    AngularFirestoreDocument
} from '@angular/fire/firestore';

import { Observable, of} from 'rxjs';
import { switchMap } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user$ : Observable<any>;

  constructor(private auth: AngularFireAuth, private afs: AngularFirestore, private router: Router) { 
      this.user$ = this.auth.authState.pipe( 
          switchMap(user => {
              return of(user);
          }
      ));
  }

}
