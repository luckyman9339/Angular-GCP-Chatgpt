import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { first, firstValueFrom } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SharedServiceService } from '../shared-service.service';
interface usageData {
  prompt: Array<number>,
  completion: Array<number>,
  total: Array<number>
};

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})

export class AboutComponent implements OnInit, AfterViewInit {
  chinese: boolean = false; // initialize chinese as false
  constructor(
    private httpClient: HttpClient,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private sharedService: SharedServiceService
  ) {
    sharedService.data$.subscribe(data => { // for when the language button has been clicked
      this.chinese = data;
      // console.log('Chinese?', this.chinese);
      this.cdr.markForCheck();
    })
  }
  russ_data: any = {}; // Initialize Russell's data object
  token_total: number = this.sharedService.total_tokens; // total tokens 2500000
  max_signup: number = this.sharedService.max_signup;
  firstNames: Array<string> = [];
  prompt_sum: number = -1;
  completion_sum: number = -1;
  total_sum: number = -1;
  prompt_value: number = 0;
  complete_value: number = 0;
  total_value: number = 0;

  // function for retrieving Russell's credentials
  async getRussellData() {
    const user_name = btoa('Russell'); // firstName
    const encoded_username = encodeURIComponent(user_name);
    const encoded_password = encodeURIComponent(btoa('Ho')); // your password here
    try {
      const observable = this.httpClient.get<any>(
        `https://backend-dot-nodal-component-399020.wl.r.appspot.com/getUserData?encoded_firstName=${encoded_username}&encoded_password=${encoded_password}`
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
  // method for retrieving first names
  getFirstNames(): void {
    this.httpClient.get<string[]>('https://backend-dot-nodal-component-399020.wl.r.appspot.com/getFirstNames')
      .subscribe({
        next: (response) => {
          this.firstNames = response;
        },
        error: (error) => {
          console.error('Error fetching first names:', error);
        }
      });
  }
  // Retrieve usage data
  async getUsageData() {
    const user_name = btoa('Russell'); // encode user firstName
    const encoded_username = encodeURIComponent(user_name);
    const observable = this.httpClient.get<any>(`https://backend-dot-nodal-component-399020.wl.r.appspot.com/getUsageData?encoded_firstName=${encoded_username}`);
    const response = await firstValueFrom(observable);
    if (response) {
      let usageData_obj = response as usageData;
      const prompt_array: Array<number> = usageData_obj.prompt.map(Number);
      const complete_array: Array<number> = usageData_obj.completion.map(Number);
      const total_array: Array<number> = usageData_obj.total.map(Number);
      // console.log('Type', typeof(total_array[0]))
      this.prompt_sum = prompt_array.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
      this.completion_sum = complete_array.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
      this.total_sum = total_array.reduce((accumulator, currentValue) => accumulator + currentValue, 0);

      this.prompt_value = (this.prompt_sum / (this.token_total / 2)) * 100;
      this.complete_value = (this.completion_sum / (this.token_total / 2)) * 100;
      this.total_value = (this.total_sum / (this.token_total)) * 100;
      this.cdr.detectChanges();
      const notification_value = parseFloat(this.total_value.toFixed(2)); // round value to 2 decimal places
      const usage_left = 100 - notification_value;
      if (usage_left === 20.00 || usage_left === 10.00) { // send notification when usage amount at 20% or 10%
        const usage_payload = {
          firstName: encoded_username,
          usageLeft: usage_left
        };
        // Call API to send email
        const email_observable = this.httpClient.post<boolean>('https://backend-dot-nodal-component-399020.wl.r.appspot.com/send-notification', usage_payload);
        const email_response = await firstValueFrom(email_observable);
        // if (email_response) {
        //   console.log('Notification email sent!');
        // }
      }
    } else { // if response is equal to false
      throw new Error("getUsageData API returned false to front end");
    }
  }
  // async function for retrieving language
  async retrieveUserDetails(token: string): Promise<any> {
    try {
      const data = await this.sharedService.initializeUserDetails(token);
      // console.log("Received data:", data);
      if (data.language === 'zh-TW') {
        this.chinese = true;
      }
      // this.sharedService.setData(this.chinese);
    } catch (error) {
      console.error("Error occurred at retrieving user details through shared service:", error);
    }
  };
  // Get Russell data
  ngOnInit(): void {
    this.getRussellData();
    this.getUsageData();
    this.getFirstNames();
    const token = localStorage.getItem('auth_token');
    if (token) {
      this.retrieveUserDetails(token);
    }
  }
  // function for setting progress bar
  setProgressBar(progressBarList: any, position: number, new_value: number) {
    // Change the value for the specific progress bar (e.g., the last one)
    const lastProgressBar = progressBarList[position - 1] as HTMLElement;
    const newAriaValueNow = new_value.toString(); // New value for accessibility
    const newWidth = newAriaValueNow + '%';  // Set new value
    lastProgressBar.style.width = newWidth;
    lastProgressBar.setAttribute('aria-valuenow', newAriaValueNow);
  };
  // Animations
  ngAfterViewInit() {
    // this.getUsageData();
    // this.getFirstNames();
    setTimeout(() => {
      const progressBarList = document.querySelectorAll('.progress-bar');
      // // Prompt Tokens
      // const prompt_value = this.prompt_sum / (this.token_total / 2);
      // // Complete Tokens
      // const complete_value = this.completion_sum / (this.token_total / 2);
      // // Total Tokens
      // const total_value = this.total_sum / (this.token_total);
      // this.setProgressBar(progressBarList, 1, prompt_value * 100);
      // console.log('Prompt sum:', this.prompt_sum);
      // this.setProgressBar(progressBarList, 2, complete_value * 100);
      // console.log('Complete sum:', this.completion_sum);
      // this.setProgressBar(progressBarList, 3, total_value * 100);
      // console.log('Total sum:', this.total_sum);

      // For signup
      const signup_value = (this.firstNames.length + 1) / this.max_signup;
      this.setProgressBar(progressBarList, 8, signup_value * 100)

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
      if (this.chinese) {
        this.snackBar.open(
          '複製!',
          '關閉',
          {
            duration: 1000,
            verticalPosition: 'bottom', // 'top' | 'bottom'
            horizontalPosition: 'center', // 'start' | 'center' | 'end'
            // panelClass: ['blue-snackbar'],
          }
        );
      } else {
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
      }
    }).catch((err) => {
      console.log('Could not copy email!', err);
    });
  }

  openLink(link: string) {
    window.open(link, '_blank'); // specifies that link should be opened in a new tab
  }
}
