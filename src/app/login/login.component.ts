import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { SharedServiceService } from '../shared-service.service';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  email_validation = new FormControl(true) // email here is firstname
  password_validation = new FormControl(true) // password
  user_validate = new FormControl(true); // makes sure that user is within the list below
  wrong_password = new FormControl(true);
  icon_show: boolean = false;
  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private sharedService: SharedServiceService,
    private route: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }


  ngOnInit(): void {
    console.log('Log in page reached');
    this.sharedService.updateData({ isLoggedIn: false });
    this.sharedService.someData$.subscribe((data) => {
      console.log('This is the data:', data);
    })
  }
  // method for showing function
  nameInput(event: Event){
    this.icon_show = false;
    for (let i=0;i<environment.users.length;i++) {
      const user_name = environment.users[i].email.toLowerCase();
      if (user_name === (event.target as HTMLInputElement).value.toLowerCase()) {
        // console.log('Name Match found!', user_name);
        this.icon_show = true;
      }
    }
  }

  // validation function
  validation() {
    if (this.loginForm.value.email.length < 2) {
      // console.log('Print email too short');
      this.email_validation.setValue(false)
      return false;
    }
    if (this.loginForm.value.password.length <= 0) {
      // console.log('Password too short');
      this.password_validation.setValue(false)
      return false;
    }
    for (let i = 0; i < environment.users.length; i++) {
      // Acquire email username (first name)
      const user_name = this.loginForm.value.email[0].toUpperCase() + this.loginForm.value.email.slice(1);
      if (user_name === environment.users[i].email) {
        if (this.loginForm.value.password === environment.users[i].password) {
          console.log('Welcome user');
          this.email_validation.setValue(true)
          this.password_validation.setValue(true)
          this.wrong_password.setValue(true);
          this.user_validate.setValue(true);
          return user_name;
        } else {
          this.wrong_password.setValue(false);
          return false;
        }
      }
    }
    return null;
  }

  onLogin(name: string) {
    // Update the data in the shared service
    this.sharedService.updateData({ isLoggedIn: true }); // push logged in true
    this.sharedService.updateUserName(name); // storing username
    // console.log('Shared service', this.sharedService);
    this.route.navigate(['/main/' + this.sharedService.sharedData.encoder]);
  }

  // submit button
  onSubmit() {
    const a: boolean = true;
    this.user_validate.setValue(true);
    this.email_validation.setValue(true)
    this.password_validation.setValue(true)
    this.wrong_password.setValue(true);
    // console.log(this.loginForm.value)
    const result = this.validation()
    if (result === null) {
      this.user_validate.setValue(false);
    } else if (result === false) {
      console.log('Authentication failed');
    } else {
      console.log('Authentication success!')
      this.onLogin(result); // result contains the name of the user
    }
  }
}
