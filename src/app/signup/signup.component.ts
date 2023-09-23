import { HttpClient } from '@angular/common/http';
import { Component, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  signupForm: FormGroup;
  email_validation = new FormControl(true);
  password_validation = new FormControl(true);
  registration_fail = new FormControl(false);
  limit_exceeded = new FormControl(false);
  firstName_required = new FormControl(false);
  registration_success = new FormControl(false);
  constructor(
    private fb: FormBuilder,
    private httpClient: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {
    this.signupForm = this.fb.group({
      firstName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    })
  }

  // validation of email
  emailValidation(email: string): boolean {
    if (!email.includes('@')) {
      return false;
    } else {
      return true;
    }
  }
  // validation of firstName
  firstNameValidation(firstName: string): boolean {
    if (firstName.length === 0) {
      return false;
    } else {
      return true;
    }
  }
  // send to API function
  async signUp() {
    const first_name = this.signupForm.value.firstName[0].toUpperCase() + this.signupForm.value.firstName.slice(1);
    const email = this.signupForm.value.email;
    const password = this.signupForm.value.password;
    // Construct payload
    const payload = {
      firstName: first_name,
      email: email,
      password: password,
    }
    // make the POST request
    // const response = await this.httpClient.post<boolean>('http://localhost:3000/registerData', payload).toPromise();
    this.httpClient.post<boolean>('https://backend-dot-nodal-component-399020.wl.r.appspot.com/registerData', payload)
    .subscribe({
      next: response => {
        // Do something with the response (true or false)
        if (response === true) {
          console.log("Successfully registered.", response);
          const email_payload = {
            firstName: first_name,
            email: email
          };
          this.httpClient.post<boolean>('https://backend-dot-nodal-component-399020.wl.r.appspot.com/send-email', email_payload)
          .subscribe({
            next: email_response => {
              console.log('Email sent?', email_response);
              this.registration_success.setValue(true);
              this.cdr.detectChanges();
            },
            error: error => {
              console.log('Something went wrong in calling the send email API', error);
            }
          });
        } else if (response === null) {
          console.log('Registration failed/duplicate entry detected');
          this.registration_fail.setValue(true);
        } else {
          console.log("Registration failed/15 person limit reached.");
          this.registration_fail.setValue(false);
          this.limit_exceeded.setValue(true);
        }
      },
      error: error => {
        console.log('An error has occurred in calling the registerData API', error);
      }
  });
  }
  // Submit button
  onSubmit() {
    // console.log('First Name:', this.signupForm.value.firstName);
    // console.log('Email:', this.signupForm.value.email);
    // console.log('Password:', this.signupForm.value.password);
    const email = this.signupForm.value.email;
    const email_check = this.emailValidation(email);
    const firstName_check = this.firstNameValidation(this.signupForm.value.firstName);
    if (email_check) {
      if (firstName_check) {
        this.signUp();
      } else {
        this.firstName_required.setValue(true);
      }
      // console.log('Registration result:', result);
    } else {
      this.email_validation.setValue(false);
    }
  }

}
