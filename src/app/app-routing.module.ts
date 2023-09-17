import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { MainComponent } from './main/main.component';
import { SignupComponent } from './signup/signup.component';
import { EditpasswordComponent } from './editpassword/editpassword.component';

const routes: Routes = [
  { path: '', component: LoginComponent},
  { path: 'main/:user', component: MainComponent}, // 'main/:user'
  { path: 'signup', component: SignupComponent},
  { path: 'editpassword/:user', component: EditpasswordComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
  
})
export class AppRoutingModule { }
