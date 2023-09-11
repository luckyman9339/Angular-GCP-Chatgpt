import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { SharedServiceService } from './shared-service.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'friday';
  isMenuOpen: boolean = false;
  isLoggedIn: boolean = false;

  constructor(private sharedService: SharedServiceService) { }
  ngOnInit(): void {
    // Subscribe to changes in the shared data
    this.sharedService.someData$.subscribe((data) => {
      if (data && data.isLoggedIn) {
        this.isLoggedIn = true;
      } else {
        this.isLoggedIn = false;
      }
    });
  }
  // // Use the service methods to share or retrieve data
  // setData() {
  //   this.sharedService.setSharedData({ message: 'Hello from MyComponent!' });
  // }

  test() {
    console.log('This is the shared service', this.sharedService);
  }

  onSidenavClick(): void{
    this.isMenuOpen = false;
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;

  }
  closeMenu(clickedOutside: boolean) {
    // console.log('This is the value', clickedOutside)
    this.isMenuOpen = false;
  }
}
