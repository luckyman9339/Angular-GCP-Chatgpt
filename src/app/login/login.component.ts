import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { SharedServiceService } from '../shared-service.service';

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

  // list of users
  users = [
    {
      email: "Russell",
      password: "Ho"
    },
    {
      email: "Kevin",
      password: "Ho"
    }
  ] 

  loginForm: FormGroup;

  constructor(private fb: FormBuilder, private sharedService: SharedServiceService) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }  


  ngOnInit(): void {
      console.log('Log in page reached');
  }

  // validation function
  validation () {
    if (this.loginForm.value.email.length < 4) {
      // console.log('Print email too short');
      this.email_validation.setValue(false)
      return false;
    }
    if (this.loginForm.value.password.length <= 0) {
      // console.log('Password too short');
      this.password_validation.setValue(false)
      return false;
    }
    for (let i = 0; i < this.users.length; i++) {
      // Acquire email username (first name)
      const user_name = this.loginForm.value.email[0].toUpperCase() + this.loginForm.value.email.slice(1);
      if (user_name === this.users[i].email) {
        if (this.loginForm.value.password === this.users[i].password) {
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
