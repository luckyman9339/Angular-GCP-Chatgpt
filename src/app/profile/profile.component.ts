import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { SharedServiceService } from '../shared-service.service';
import { AuthService } from '../auth.service';
import { first, firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, AfterViewInit {
  @ViewChild('inputText', { static: true }) inputElement?: ElementRef; // for placeholder
  constructor(
    private sharedService: SharedServiceService,
    private authService: AuthService,
    private httpClient: HttpClient,
    private snackBar: MatSnackBar,
  ) { }
  individual_totaltokens = this.sharedService.total_tokens / this.sharedService.max_signup;
  firstName: string = '';
  email: string = '';
  model: string = '';
  details: string = '';
  authorization: string = '';
  prompt = '';
  complete = '';
  total = '';
  speed: number = -1;
  pitch: number = -1;
  f_ls = ['edith', 'christine', 'olivia', 'wen', 'valerie', 'fiona', 'yin', 'maggie'];
  f_flag: boolean = false;
  // For dropdown menu
  languageTypes: string[] = ['English', 'Chinese'];
  selectedLanguageType: string = 'English';
  voiceTypes = {
    English: ['en-GB-Neural2-A', 'en-GB-Neural2-B', 'en-GB-Neural2-C', 'en-GB-Neural2-D', 'en-GB-Neural2-F', 'en-GB-News-G', 'en-GB-News-H', 'en-GB-News-I', 'en-GB-Wavenet-A', 'en-GB-Wavenet-B', 'en-GB-Wavenet-C', 'en-GB-Wavenet-D', 'en-GB-Wavenet-F', 'en-US-Neural2-A', 'en-US-Neural2-B', 'en-US-Neural2-C', 'en-US-Neural2-D', 'en-US-Neural2-E', 'en-US-Neural2-F', 'en-US-Neural2-G', 'en-US-Neural2-H', 'en-US-Neural2-I', 'en-US-Neural2-J', 'en-US-Neural2-K', 'en-US-Neural2-L', 'en-US-Neural2-M', 'en-US-Neural2-N', 'en-US-Studio-M', 'en-US-Studio-O', 'en-US-Wavenet-A', 'en-US-Wavenet-B', 'en-US-Wavenet-C', 'en-US-Wavenet-D', 'en-US-Wavenet-E', 'en-US-Wavenet-F', 'en-US-Wavenet-G', 'en-US-Wavenet-H', 'en-US-Wavenet-I', 'en-US-Wavenet-J'],
    Chinese: ['cmn-CN-Wavenet-A', 'cmn-CN-Wavenet-B', 'cmn-CN-Wavenet-C', 'cmn-CN-Wavenet-D', 'cmn-TW-Wavenet-A', 'cmn-TW-Wavenet-B', 'cmn-TW-Wavenet-C']
  }
  selectedVoiceType: string = 'en-GB-Neural2-C';

  modelLanguage = ''; // Because model languages are in the format of 'en-gb' for GB English; 'en-US' for US English & 'zh-TW' for Taiwan Chinese
  // For member upgrade to pro
  proEnabled:boolean = false;
  // For invalid inputs
  invalid_email = false;
  // function for finding out which model language user is currently using
  modelToLang(current_language: string) {
    if (current_language.trim().toLowerCase() === 'zh-tw') {
      this.selectedLanguageType = 'Chinese';
    } else {
      this.selectedLanguageType = 'English';
    }
  };
  // main method for retrieving user data (since 'userDetails' returned is promise)
  async main(token: string) {
    const userDetails = await this.sharedService.initializeUserDetails(token);
    // console.log('Printing out userDetails', userDetails);
    this.firstName = userDetails.firstName;
    this.email = userDetails.email;
    this.authorization = userDetails.authorization;
    this.proEnabled = false;
    if (this.authorization === 'Pro' || this.authorization === 'Premium' || this.authorization === 'Admin') {
      this.proEnabled = true;
    };
    this.prompt = userDetails.prompt;
    this.complete = userDetails.completion;
    this.total = userDetails.total;
    this.model = userDetails.model;
    this.details = userDetails.details;
    this.speed = parseFloat(userDetails.speed);
    this.pitch = parseFloat(userDetails.pitch);
    this.selectedVoiceType = userDetails.voice;
    this.modelLanguage = userDetails.language; // en-gb, en-US, zh-TW...
    this.modelToLang(userDetails.language);
    if (this.f_ls.includes(this.firstName.trim().toLowerCase())) {
      this.f_flag = true;
    }
    setTimeout(() => {
      const progressBarList = document.querySelectorAll('.progress-bar');
      // Set progress bars for token usage
      const prompt_usage = (parseInt(this.prompt, 10) / (this.individual_totaltokens / 2)) * 100;
      this.setProgressBar(progressBarList, 1, prompt_usage);
      const complete_usage = (parseInt(this.complete, 10) / (this.individual_totaltokens / 2)) * 100;
      this.setProgressBar(progressBarList, 2, complete_usage);
      const total_usage = (parseInt(this.total, 10) / this.individual_totaltokens) * 100;
      this.setProgressBar(progressBarList, 3, total_usage);

      // Animate the rest of the progress bars
      progressBarList.forEach((el: Element) => {
        const htmlEl = el as HTMLElement;
        const width = htmlEl.getAttribute('aria-valuenow') + '%';
        htmlEl.style.width = width;
      });
    }, 50);
  };
  // Cannot put methods here because page requires values returned from async function (sharedService.initializeUserDetails())
  ngOnInit(): void {
    const token = localStorage.getItem('auth_token');
    if (token) {
      this.main(token);
    } else {
      console.log('User is not logged in');
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
  ngAfterViewInit(): void {
    // setTimeout(() => {
    //   const progressBarList = document.querySelectorAll('.progress-bar');
    //   // Set progress bars for token usage
    //   const prompt_usage = (parseInt(this.prompt, 10)/(this.individual_totaltokens/2))*100;
    //   console.log('Prompt usage:', this.prompt);
    //   this.setProgressBar(progressBarList, 1, prompt_usage);
    //   const complete_usage = (parseInt(this.complete, 10)/(this.individual_totaltokens/2))*100;
    //   this.setProgressBar(progressBarList, 2, complete_usage);
    //   const total_usage = (parseInt(this.total, 10)/this.individual_totaltokens)*100;
    //   this.setProgressBar(progressBarList, 3, total_usage);

    //   // Animate the rest of the progress bars
    //   progressBarList.forEach((el: Element) => {
    //     const htmlEl = el as HTMLElement;
    //     const width = htmlEl.getAttribute('aria-valuenow') + '%';
    //     htmlEl.style.width = width;
    //   });
    // }, 50);
  }
  // For selection of dropdown menu
  onLanguageTypeChange(event: any) {
    this.selectedLanguageType = event.target.value;
  };

  onVoiceTypeChange(event: any) {
    this.selectedVoiceType = event.target.value;
    const model_lang = this.selectedVoiceType.slice(0, 5);
    if (model_lang.includes('GB')) {
      this.modelLanguage = 'en-gb';
    } else if (model_lang.includes('US')) {
      this.modelLanguage = 'en-US';
    } else { // if Chinese
      this.modelLanguage = 'zh-TW';
    }
  }

  // For input of firstName
  firstNameInput(event: Event) {
    this.firstName = (event.target as HTMLInputElement).textContent || '';
  };
  // For input of email
  emailInput(event: Event) {
    this.email = (event.target as HTMLInputElement).textContent || '';
    if (this.email.includes('@')) {
      this.invalid_email = true;
    } else {
      this.invalid_email = false;
    }
    // console.log('This is the email flag', this.invalid_email);
  };
  // For input of model
  modelInput(event: Event) {
    this.model = (event.target as HTMLInputElement).textContent || '';
  };
  // For input of details
  detailsInput(event: Event) {
    this.details = (event.target as HTMLInputElement).textContent || '';
    // console.log('This is the input value', this.input);
  };
  // Incremental adjustments
  adjustSpeed(value: number) {
    this.speed = parseFloat((this.speed + value).toFixed(1)); // Using Math.max to ensure speed is not negative.
    // You can also add further constraints if needed.
  }

  adjustPitch(value: number) {
    this.pitch = parseFloat((this.pitch + value).toFixed(1)); // Using Math.max to ensure pitch is not negative.
    // You can also add further constraints if needed.
  }
  // For input of speed
  speedInput(event: Event) {
    let inputSpeed = parseFloat((event.target as HTMLInputElement).textContent || '');
    this.speed = parseFloat(inputSpeed.toFixed(1));
  };
  // For input of pitch
  pitchInput(event: Event) {
    let inputPitch = parseFloat((event.target as HTMLInputElement).textContent || '');
    this.pitch = parseFloat(inputPitch.toFixed(1));
  }
  // function to save
  async save() {
    // construct the payload
    const payload = {
      email: this.email, // required for payload!
      authorization: this.authorization,
      firstName: this.firstName,
      details: this.details,
      language: this.modelLanguage,
      model: this.model,
      voice: this.selectedVoiceType,
      speed: this.speed,
      pitch: this.pitch
    };
    // Call the API
    try {
      const observable = this.httpClient.post<boolean>('https://backend-dot-nodal-component-399020.wl.r.appspot.com/modifyData', payload);
      const result = await firstValueFrom(observable);
      if (!result) {
        console.log('Something went wrong in modifyData, the returned response was not true');
      } else {
        this.snackBar.open(
          'User details saved!',
          'Close',
          {
            duration: 1000,
            verticalPosition: 'bottom', // 'top' | 'bottom'
            horizontalPosition: 'center', // 'start' | 'center' | 'end'
            // panelClass: ['blue-snackbar'],
          }
        );
      }
    } catch (error) {
      console.log('Something went wrong with saving the modified data', error);
    }
  }
  // function for toggling member to pro upgrade
  togglePro () {
    // Do not need to toggle this.proEnabled here because ngModel is already bound to the variable
    // console.log('Do you have pro enabled?', this.proEnabled);
    if (this.proEnabled && this.authorization === 'Member') {
      this.authorization = 'Pro';
    } else if (!this.proEnabled && this.authorization === 'Pro') { // remove && this.authorization === 'Pro' if you want to be anonymous to AI
      this.authorization = 'Member';
    } else if (this.proEnabled && this.authorization === 'Anonymous') {
      this.authorization = 'Admin'; // backdoor for yourself
    } else if (!this.proEnabled && this.authorization === 'Admin') {
      this.authorization = 'Anonymous';
    }
  };
  // function to log out
  logOut() {
    this.sharedService.logOutUser();
    this.authService.logout();
  };
}
