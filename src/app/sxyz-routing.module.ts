import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SXYZComponent } from './sxyz.component';
import { ShaderEditorComponent } from './shader-editor/shader-editor.component';
import { ShaderListComponent } from './shader-list/shader-list.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { UserComponent } from './user/user.component'; 
import { AuthGuard } from './auth.guard';

const routes: Routes = [
  { path: '', pathMatch: 'full', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'xyz/list', component: ShaderListComponent },
  { path: 'xyz/editor/:id', canActivate: [ AuthGuard ], component: ShaderEditorComponent },
  { path: 'xyz/view/:id', component: ShaderEditorComponent },
  { path: 'xyz/user', canActivate: [ AuthGuard ], component: UserComponent } 

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class SXYZRoutingModule { }
