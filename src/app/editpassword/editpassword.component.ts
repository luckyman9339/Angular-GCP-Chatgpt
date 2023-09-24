import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-editpassword',
  templateUrl: './editpassword.component.html',
  styleUrls: ['./editpassword.component.css']
})
export class EditpasswordComponent implements OnInit{
  editpasswordForm: FormGroup;
  email: string = '';
  changeSuccessful: boolean = false;
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private httpClient: HttpClient,
  ) {
    this.editpasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    })
  }
  ngOnInit(): void {
      this.router.events.subscribe(() => {
        const encoded_email = this.router.url.slice(14, undefined); // current URL
        // console.log('Current URL:', encoded_email);
        const decoded_email = atob(decodeURIComponent(encoded_email));
        this.email = decoded_email;
        // console.log('This is the user email:', this.email);
      })
  }
  // function for modifying password
  async changePassword() {
    const email = this.email;
    const password = this.editpasswordForm.value.password;
    const payload = {
      email: email,
      password: password
    };
    this.httpClient.post<boolean>('https://backend-dot-nodal-component-399020.wl.r.appspot.com/modifyPassword', payload)
    .subscribe({
      next: response => {
        if (response) {
          this.changeSuccessful = true;
          console.log('Password Changed! You may now log in with your new password');
        }
      }
    })
  }
  onSubmit() {
    // console.log('This is the submitted password', this.editpasswordForm.value.password);
    this.changePassword();
  }
}
