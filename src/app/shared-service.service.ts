import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedServiceService {
  private someDataSubject = new BehaviorSubject<any>(false);
  someData$ = this.someDataSubject.asObservable();
  sharedData = {};
  // specifically for showing hamburger menu after logging in
  updateData(data: any) {
    this.someDataSubject.next(data);
  }
  updateUserName(name: string) {
    this.sharedData = {
      firstName: name
    }
  }
}
