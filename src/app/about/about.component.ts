import { Component, OnInit, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';


@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit, AfterViewInit {
  constructor(
    private httpClient: HttpClient,
    private snackBar: MatSnackBar,
  ) { }
  russ_data: any = {}; // Initialize Russell's data object

  // function for retrieving Russell's credentials
  async getRussellData() {
    const user_name = btoa('Russell'); // firstName
    const encoded_username = encodeURIComponent(user_name);
    const encoded_password = encodeURIComponent(btoa('Ho'));
    try {
      const observable = this.httpClient.get<any>(
        `https://nodal-component-399020.wl.r.appspot.com/getUserData?encoded_firstName=${encoded_username}&encoded_password=${encoded_password}`
      );
      const russ = await firstValueFrom(observable); // convert observable data into promise
      if (russ === false) {
        console.log('Russell does not seem to be in the database for some reason, please contact administrator Russell');
      } else { // retrieve Russell data
        this.russ_data = russ.data_json;
        // console.log('This is Russell Auth:', this.russ_data.authorization)
        // console.log("Russell's data:", this.russ_data);
      }
    } catch (error) {
      console.log("Something went wrong in getting Russell's data", error);
    }
  };
  // Get Russell data
  ngOnInit(): void {
    this.getRussellData();
  }
  // Animations
  ngAfterViewInit() {
    setTimeout(() => {
      const progressBarList = document.querySelectorAll('.progress-bar');
      
      // Change the value for the specific progress bar (e.g., the last one)
      const lastProgressBar = progressBarList[progressBarList.length - 1] as HTMLElement;
      const newAriaValueNow = '50'; // New value for accessibility
      const newWidth = newAriaValueNow + '%';  // New value
      lastProgressBar.style.width = newWidth;
      lastProgressBar.setAttribute('aria-valuenow', newAriaValueNow);

      // Animate the rest of the progress bars
      progressBarList.forEach((el: Element) => {
        const htmlEl = el as HTMLElement;
        const width = htmlEl.getAttribute('aria-valuenow') + '%';
        htmlEl.style.width = width;
      });
    }, 50);
  }

  // function to copy text
  copyText(text: string) {
    // Use the clipbaord API to copy the text
    navigator.clipboard.writeText(text).then(() => {
      // Show notificatio when the text has been copied
      this.snackBar.open(
        'Copied!',
        'Close',
        {
          duration: 1000,
          verticalPosition: 'bottom', // 'top' | 'bottom'
          horizontalPosition: 'center', // 'start' | 'center' | 'end'
          // panelClass: ['blue-snackbar'],
        }
      );
    }).catch((err) => {
      console.log('Could not copy email!', err);
    });
  }

  openLink(link: string) {
    window.open(link, '_blank'); // specifies that link should be opened in a new tab
  }
}
