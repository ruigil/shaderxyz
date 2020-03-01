import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SXYZRoutingModule } from './sxyz-routing.module';
import { SXYZComponent } from './sxyz.component';
import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { environment } from '../environments/environment';
import { ServiceWorkerModule } from '@angular/service-worker';
import { ShaderEditorComponent, PropertiesDialog, UserDialog, ShowErrorsDialog } from './shader-editor/shader-editor.component'; 
import { AceEditorModule } from 'ng2-ace-editor'; 
import { MatToolbarModule, 
         MatGridListModule, 
         MatCardModule, 
         MatMenuModule, 
         MatIconModule, 
         MatButtonModule, 
         MatTableModule, 
         MatPaginatorModule, 
         MatSortModule, 
         MatTabsModule, 
         MatDividerModule, 
         MatButtonToggleModule, 
         MatDialogModule, 
         MatInputModule, 
         MatBadgeModule, 
         MatFormFieldModule, 
         MatOptionModule, 
         MatSelectModule, 
         MatListModule, 
         MatChipsModule,
         MatTooltipModule,
         MatSlideToggleModule,
         MatSnackBarModule,
         MatExpansionModule } from '@angular/material';
import { DashboardComponent } from './dashboard/dashboard.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ShaderListComponent } from './shader-list/shader-list.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { AboutDialog } from './home/home.component'; 
import { NgxAuthFirebaseUIModule } from 'ngx-auth-firebaseui';
import { UserComponent } from './user/user.component';

@NgModule({
  declarations: [
    SXYZComponent,
    ShaderEditorComponent,
    DashboardComponent,
    ShaderListComponent,
    HomeComponent,
    LoginComponent,
    AboutDialog,
    PropertiesDialog,
    UserDialog,
    ShowErrorsDialog,
    UserComponent
  ],
  imports: [
    BrowserModule,
    SXYZRoutingModule,
    FormsModule,
    MatToolbarModule, 
    MatGridListModule, 
    MatCardModule, 
    MatMenuModule, 
    MatIconModule, 
    MatButtonModule, 
    MatTableModule, 
    MatPaginatorModule, 
    MatSortModule, 
    MatTabsModule, 
    MatDividerModule, 
    MatButtonToggleModule, 
    MatDialogModule, 
    MatInputModule, 
    MatBadgeModule, 
    MatFormFieldModule, 
    MatOptionModule, 
    MatSelectModule, 
    MatListModule, 
    MatChipsModule, 
    MatTooltipModule,
    MatSlideToggleModule,
    NgxAuthFirebaseUIModule,
    MatSnackBarModule,
    MatExpansionModule,
    AceEditorModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
    NgxAuthFirebaseUIModule.forRoot(environment.firebase),
    BrowserAnimationsModule
  ],
  providers: [],
  bootstrap: [SXYZComponent],
  entryComponents: [ AboutDialog, PropertiesDialog, UserDialog, ShowErrorsDialog ] 
})
export class SXYZModule { }
 