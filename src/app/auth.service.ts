import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { SharedServiceService } from './shared-service.service';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private loggedIn = new BehaviorSubject<boolean>(false);
  // for reference by auth.guard.ts
  get isLoggedIn() {
    return this.loggedIn.asObservable();
  }

  constructor(
    private httpClient: HttpClient,
    private sharedService: SharedServiceService,
    private router: Router,
  ) { }

  // Method within service to log user in
  async login(username: string, password: string):Promise<boolean> {
    const user_name = btoa(username); // firstName
    const encoded_username = encodeURIComponent(user_name);
    const encoded_password = encodeURIComponent(btoa(password));
    try {
      const observable = this.httpClient.get<any>(
        `https://nodal-component-399020.wl.r.appspot.com/getUserData?encoded_firstName=${encoded_username}&encoded_password=${encoded_password}`
      );
      const res = await firstValueFrom(observable); // use firstValueFrom to convert the Observable returned by the API call into a Promise
      // res here is a promise
      if (res === false) { // act on promise
        console.log('Wrong Password!');
        // Handle wrong password case
        this.loggedIn.next(false);
      } else {
        // console.log('Success!');
        this.loggedIn.next(true);
        // this.cdr.detectChanges();
        // console.log('This is the user data', res);
        this.sharedService.storeUserDetails(res); // if false then store returned json object within sharedService
        this.router.navigate(['/main/' + user_name]);
        return true;
      }
    } catch (err) {
      // Handle errors here
      console.error(err);
    }
    return false;
  }
  // Method for handling log out
  logout() {
    this.loggedIn.next(false);
    this.router.navigate(['/']);
  }
  
}
