import { Component, OnInit, ViewChild, ElementRef, Renderer2, NgZone, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Converter } from 'opencc-js'; // for translation purposes (china to taiwan)
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';
import { SharedServiceService } from '../shared-service.service';
import { OpenAI } from 'openai'; // request openai

import { trigger, state, style, transition, animate } from '@angular/animations';

declare var SpeechRecognition: any;  // Add this line for speech recognition

const openai = new OpenAI({
  apiKey: environment.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Enable browser-like environment (use with caution)
});

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css'],
  animations: [
    trigger('fadeInOut', [
      state('void', style({
        opacity: 0
      })),
      transition('void <=> *', animate(1000)),
    ])
  ]
})
export class MainComponent implements OnInit, OnDestroy {
  // Declare previous handlers as class properties
  private prevPlayHandler: any = null;
  private prevEndedHandler: any = null;
  private routerSubscription: Subscription = new Subscription();
  private isRecognitionInitialized = false;
  constructor(
    private sharedService: SharedServiceService,
    private renderer: Renderer2,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) { }
  @ViewChild('responseCardContainer', { static: false }) responseCardContainer?: ElementRef;
  @ViewChild('inputText', { static: true }) inputElement?: ElementRef; // for placeholder
  typingInterval: any; // Declare a class property to store interval ID
  voice_input: any = true; // controls icon change between voice input & typing (true for voice, false for typing, null for mute)
  isMuted: boolean = false;
  stop_icon: boolean = false; // controls stop button icon
  active_icon: boolean = false;
  stop_typing: boolean = false;
  input: string = ''; // typed respone from user
  response: string = ''; // initialize response string
  recognition: any; // for speech recognition
  audio_complete: boolean = false;
  links: Array<string> = []; // for storing hyperlinks
  link_flag: boolean = false;
  model_ai: string = 'Friday';
  language: string = 'en-gb'; // 'en-gb' for GB English; 'en-US' for US English. Use 'zh-TW' for Taiwan Chinese.
  send_command: boolean = false; // flag that decides whether or not to send command
  listenCommand: string = '';
  dynamicPlaceholder: string = '';
  converter = Converter({ from: 'cn', to: 'tw' }) //  to translate from cn to tw chinese
  voice_output: boolean = true;
  // variables for voice en-GB-Neural2-C cmn-TW-Wavenet-A
  model_name: string = 'en-GB-Neural2-C' // take a look: https://cloud.google.com/text-to-speech/docs/voices
  speed = '1.3';
  pitch = '-2.0';
  // function that assigns the variables on ngOnInit
  attributeVariables(user_details: any) {
    this.model_ai = user_details.model;
    this.language = user_details.language;
    this.model_name = user_details.voice;
    this.speed = user_details.speed;
    this.pitch = user_details.pitch;
  }
  generateRandomResponse(): string {
    const responses = [
      'Ask me anything',
      'What would you like to know?',
      'I\'m here to help! Ask me anything.',
      'How can I assist you today?',
      'Feel free to ask me anything.',
      'What are you curious about today?',
      'Is there something specific you\'d like to know?',
      'What can I help you with today?',
      'Hi! What would you like to ask?'
    ];

    // Pick a random response from the array
    const randomIndex = Math.floor(Math.random() * responses.length);
    return responses[randomIndex];
  }
  // async function to retrieve userDetails
  async retrieveUserDetails(token: string): Promise<any> {
    try {
      const data = await this.sharedService.initializeUserDetails(token);
      // console.log("Received data:", data);
      return data;
    } catch (error) {
      console.error("Error occurred:", error);
    }
  }
  // Method that encapsulates initializing speech recognition
  async initializeSpeechRecognition(token: string) {
    if (this.isRecognitionInitialized) {
      return;
    }
    const user_details = await this.retrieveUserDetails(token);
    // console.log('User details', user_details);
    this.attributeVariables(user_details);
    // Initialize data-placeholder attribute
    // this.renderer.setAttribute(this.inputElement?.nativeElement, 'data-placeholder', `Enter text to chat with ${this.model_ai} or say "${this.model_ai} how are you doing today?"`);
    this.dynamicPlaceholder = `Enter text to chat with ${this.model_ai} or say "${this.model_ai} how are you doing today?"`;
    this.response = this.generateRandomResponse();
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.language;
      // Restart the recognition service when it ends
      this.recognition.onend = () => {
        if (!this.isMuted) {
          console.log('Recognition service cycle ended, restarting...');
          this.recognition.start();
        }
      };
      this.recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          // translate to traditional (taiwan) chinese if language is chinese
          if (this.recognition.lang === 'zh-TW' || this.recognition.lang === 'zh-CN') {
            transcript = this.converter(event.results[i][0].transcript.trim());
          } else {
            transcript = event.results[i][0].transcript.trim();
          }
          if (event.results[i].isFinal) { // for final transcript
            // English requires the added in command of splitting the transcript and taking the first word
            if (((this.recognition.lang === 'en-US' || this.recognition.lang === 'en-gb') && this.send_command === true && this.model_ai.toLowerCase() === transcript.split(" ")[0].toLowerCase()) || (this.recognition.lang === 'zh-TW' && this.send_command === true)) {
              this.active_icon = true;
              this.voice_input = true;
              console.log('I hear you loud and clear sir');
              console.log('Final transcript: ', transcript); // transcript that is final (that should be submitted to chat)
              this.input = transcript; // update this.input to display the values the user has entered through voice command
              this.cdr.detectChanges(); // force update in HTML
              this.chat(this.input, this.model_ai); // place this.chat here (COMMENT/UNCOMMENT)
              this.send_command = false;
            } else if (this.link_flag === true && this.isMuted === false && transcript !== '') { // audio_complete
              console.log('Link Open transcript: ', transcript); // transcript that is final (that should be submitted to chat)
              this.linkOpening(transcript);
              this.link_flag = false; // set flag back to false at the end
              this.audio_complete = false; // set flag back to false
            }
            // put in link opening logic here (this.response is the response from OpenAI)
          } else { // for interim transcript
            // this.listenCommand = transcript;
            if (this.model_ai.toLowerCase() === transcript.toLowerCase()) { // if value is equal to name of model_ai then respond
              console.log('AI model word detected within speech');
              this.voice_input = true;
              this.send_command = true;
            }
            // console.log('Interim transcript: ', transcript); // transcript that is constantly being typed out
          }
        }
      };
      this.recognition.start();
      // Mark the recognition service as initialized
      this.isRecognitionInitialized = true;
    } else {
      // Handle the error or inform the user that their browser is not supported
      console.log("Unfortunately your browser does not support Web Speech API");
    }
  };

  ngOnInit(): void {
    console.log("ngOnInit called");
    const token = localStorage.getItem('auth_token');
    if (token) {
      this.initializeSpeechRecognition(token); // Initialize it once

      this.routerSubscription = this.router.events.subscribe((event: any) => {
        if (event instanceof NavigationEnd) {
          this.initializeSpeechRecognition(token); // Re-initialize recognition service
        }
      });
    };
  }
  // function to open links
  linkOpening(command: string) {
    if (command.trim().length !== 0) { // ensures that command is given
      const command_ls = command.trim().split(' ').map(item => item.toLowerCase()); // for command
      this.links = this.links.map(url => { // regex expression to remove parentheses surrounding links
        if (url.startsWith("[") || url.startsWith("(") || url.startsWith("{")) {
          return url.slice(1, -1).split("/")[0];
        }
        return url;
      });
      this.links = this.links.map(url => url.startsWith('https://') ? url : 'https://' + url);
      if (this.links.length > 1) {
        // console.log('These are the links', this.links);
        for (let k = 0; k < command_ls.length; k++) {
          if (command_ls[k].includes('first') || command_ls[k].includes('number one') || command_ls[k].includes('一')) {
            this.openLink(this.links[0]); // zero-based indexing
          }
          if (command_ls[k].includes('second') || command_ls[k].includes('two') || command_ls[k].includes('二')) {
            this.openLink(this.links[1]); // zero-based indexing
          }
          if (command_ls[k].includes('third') || command_ls[k].includes('three') || command_ls[k].includes('三')) {
            this.openLink(this.links[2]); // zero-based indexing
          }
          if (command_ls[k].includes('fourth') || command_ls[k].includes('four') || command_ls[k].includes('四')) {
            this.openLink(this.links[3]); // zero-based indexing
          }
          if (command_ls[k].includes('fifth') || command_ls[k].includes('five') || command_ls[k].includes('五')) {
            this.openLink(this.links[4]);
          }
          if (command_ls[k].includes('both') || command_ls[k].includes('兩')) {
            for (let i = 0; i < 2; i++) {
              this.openLink(this.links[i]);
            }
          }
          if (command_ls[k].includes('all') || command_ls[k].includes('every') || command_ls[k].includes('全部') || command_ls[k].includes('所有')) {
            for (let i = 0; i < this.links.length; i++) {
              this.openLink(this.links[i]);
            }
          }
        }
      } else { // if there is only one link on the list
        this.openLink(this.links[0]); // open the first link
      }
    }
  };
  // function to open links
  openLink(link: string) {
    window.open(link, '_blank'); // specifies that link should be opened in a new tab
  };
  // Function to simulate typing animation
  typeResponse(response: string) {
    // console.log('Response container', this.responseCardContainer)
    this.stop_typing = false; // Initialize stop_typing to false
    this.response = ''; // Clear the response first
    let index = 0;
    // Before calling setInterval, clear any existing intervals.
    if (this.typingInterval) {
      clearInterval(this.typingInterval);
    }
    this.typingInterval = setInterval(() => {
      this.stop_icon = true; // stop icon displayed
      if (this.stop_typing) { // check the stop_typing flag
        clearInterval(this.typingInterval); // Stops the animation
        this.stop_icon = false;
        this.active_icon = false;
        return;
      }
      if (index < response.length) {
        this.response += response.charAt(index);
        index++;

        // Use NgZone to make sure the UI gets updated (for scrolling)
        this.ngZone.run(() => {
          if (this.responseCardContainer) {
            const containerElement = this.responseCardContainer.nativeElement;
            // console.log('scrollHeight:', containerElement.scrollHeight);
            // console.log('scrollTop:', containerElement.scrollTop);
            // console.log('clientHeight:', containerElement.clientHeight); clientHeight has to be less than scrollHeight
            this.renderer.setProperty(containerElement, 'scrollTop', containerElement.scrollHeight);
          }
        });
      } else {
        clearInterval(this.typingInterval); // Stop the animation when done
        this.stop_icon = false; // stop icon removed once animation has been completed
        this.active_icon = false;
        this.cdr.detectChanges();
      }
    }, 55); // Adjust the interval to control typing speed
  }
  // function to extract URLs (Chinese)
  extractUrls = (regex: RegExp, response_temp: string) => {
    let match;
    while ((match = regex.exec(response_temp)) !== null) {
      let url = match[0];
      // Check if the matched URl starts directly with http:// or https://
      if (url.startsWith('http://') || url.startsWith('https://')) {
        this.links.push(url);
      } else { // For URLs containing enclosing characters
        url = match[0].slice(0, -1);  // Remove enclosing characters
        this.links.push(url);
      }
    }
    // console.log('Links', this.links);
  };
  // API function call
  async chat(prompt: string, ai: string) {
    const initial_response = await this.sharedService.openaiChat(prompt, ai);
    let complete_response = '';
    this.links = []; // clear links
    let response_temp = '';
    if (this.language === 'zh-TW') {
      response_temp = this.converter(initial_response.choices[0].message.content)
      // chinese does not possess any spaces
      // const bracketedRegex = /\(https:\/\/.*?\/\)/g;
      // const quotedWithHttpRegex = /'https:\/\/.*?\/'/g; // Http
      // const quotedWithHttpsRegex = /'https:.*?\/'/g; // Https
      // this.extractUrls(bracketedRegex, response_temp);
      // this.extractUrls(quotedWithHttpRegex, response_temp);
      // this.extractUrls(quotedWithHttpsRegex, response_temp);

      // // Remove all URLs from the string
      // this.response = response_temp.replace(bracketedRegex, "")
      //                                       .replace(quotedWithHttpRegex, "")
      //                                       .replace(quotedWithHttpsRegex, "");
      // const regex = /https?:\/\/[^\s()<>]+?(?=[\s()<>])/g;
      const regex = /https?:\/\/[^\s()<>]+?(?=[\s()<>])|\(https?:\/\/.*?\)\/|'https?:\/\/.*?'\/|'https:.*?'\/|'https?:\/\/.*?'/g;
      this.extractUrls(regex, response_temp);
      // Remove all such URLs from the string
      complete_response = response_temp.replace(regex, "");
      // flag for whether links are detected
      await this.fetchAudio(complete_response, false); // response from ChatGPT (and voice)
      if (this.links.length !== 0) {
        console.log('Links:', this.links);
        console.log('Links ready to open sir');
        this.link_flag = true;
        if (this.links.length === 1) {
          this.fetchAudio('需要我幫您打開這個連結嗎?', true);
        } else {
          this.fetchAudio('需要我幫您打開這些連結嗎?', true);
        }
      }
    } else { // if input spacing available
      response_temp = initial_response.choices[0].message.content;
      // to parse for links
      let response_ls = response_temp.split(' ');
      let final_ls: Array<string> = [];
      for (let i = 0; i < response_ls.length; i++) {
        if (response_ls[i].startsWith('https://') || response_ls[i].startsWith('(https://') || response_ls[i].startsWith('www.') || response_ls[i].startsWith('[https://') || response_ls[i].startsWith('：https://') || response_ls[i].startsWith('(www.') || response_ls[i].startsWith('[www.')) {
          // console.log('Response', response_ls[i]);
          const link_ls1: Array<string> = response_ls[i].split('\n'); // split by \n new line character
          // const link_ls2: Array<string> = link_ls1.flatMap(line => line.split('/:')); // and '/:'
          let link = link_ls1.shift() as string; // return link and push it
          if (link) link = link.replace(/\(|\)/g, ''); // remove parentheses if they are present
          if (link) link = link.replace(/"/g, ''); // remove double quotes if they are present
          if (link) link = link.replace(/'/g, ''); // remove single quotes if they are present
          if (link) link = link.replace(/]/g, ''); // remove square parentheses if they are present
          this.links.push(link);
          final_ls.push(...link_ls1); // concatenate rest of list
        } else {
          final_ls.push(response_ls[i]);
        }
      }
      complete_response = final_ls.join(' ');
      await this.fetchAudio(complete_response, false); // response from ChatGPT (voice)
      // flag for whether links are detected
      if (this.links.length !== 0) {
        console.log('Links:', this.links);
        console.log('Links ready to open sir');
        this.link_flag = true;
        if (this.links.length === 1) {
          this.fetchAudio('Would you like me to open this link for you?', true);
        } else {
          this.fetchAudio('Would you like me to open these links for you?', true);
        }
      }
    }
    // console.log('This is the response', this.response);
    // // Trigger the typing animation
    // this.typeResponse(this.response);
  }

  // Chatbox for OpenAI
  chatInput(event: Event) {
    this.input = (event.target as HTMLInputElement).value || '';
    // console.log('This is the input value', this.input);
  }

  // Stop text generation
  stop() {
    this.stop_typing = true;
    this.stop_icon = false;
    this.active_icon = false;
    if (this.isMobile()) { // only applies to mobile
      this.recognition.stop();
      setTimeout(() => {
        this.recognition.start();
      }, 100);

    }
    if (this.typingInterval) {
      clearInterval(this.typingInterval);
    }
  }

  submit() {
    this.stop_typing = false; // set stop_typing to false
    // console.log('This is the input value:', this.input);
    this.active_icon = true;
    this.cdr.detectChanges();
    this.chat(this.input, this.model_ai);
  }
  // switching voice inputs when user clicks on edit text button
  inputSwitch() {
    this.voice_input = false;
  }
  // Destroy the speech recognition element
  ngOnDestroy(): void {
    // console.log("Component destroyed");
    this.routerSubscription.unsubscribe();
    if (this.recognition) {
      this.recognition.onresult = null; // Remove event listener
      this.recognition.onend = null; // Remove event listener
      this.recognition.stop(); // Stop the recognition service
      this.isRecognitionInitialized = false; // Reset the flag
    }
  }


  // mute button function
  mute() {
    this.isMuted = true;
    this.recognition.stop();
  }
  mute_off() {
    this.isMuted = false;
    this.recognition.start();
  }
  // silence button
  silence() {
    this.voice_output = !this.voice_output;
  }
  // Helper function to convert base64 to ArrayBuffer
  base64ToArrayBuffer(base64: string) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
  // fetch audio and play!
  async fetchAudio(input: string, link: boolean): Promise<void> {
    // console.log('This is the input:', input);
    return new Promise(async (resolve) => {
      if (this.voice_output === true) { // if voice output is not silenced
        const res = await fetch(`https://backend-dot-nodal-component-399020.wl.r.appspot.com/speak?text=${input}&languageCode=${this.language}&name=${this.model_name}&speed=${this.speed}&pitch=${this.pitch}`);
        // const res = await fetch(`http://localhost:3000/speak?text=${input}&languageCode=${this.language}&name=${this.model_name}&speed=${this.speed}&pitch=${this.pitch}`);
        const data = await res.json();
        const audioBase64 = data.audioBase64;
        // const blob = await res.blob(); // code to run on local environment
        // Convert base64 to ArrayBuffer
        const audioBuffer = this.base64ToArrayBuffer(audioBase64);

        // Create blob from ArrayBuffer
        const blob = new Blob([audioBuffer], { type: 'audio/wav' });
        const url = window.URL.createObjectURL(blob);
        // Explicitly specify the type of 'audio' as HTMLAudioElement
        const audio: HTMLAudioElement = document.getElementById('audioPlayer') as HTMLAudioElement;
        // Listen for the 'play' event to know when the audio starts playing
        if (this.prevPlayHandler) {
          audio.removeEventListener('play', this.prevPlayHandler);
        }
        if (this.prevEndedHandler) {
          audio.removeEventListener('ended', this.prevEndedHandler);
        }
        let stopInterval: any;
        this.prevPlayHandler = () => {
          // Setting up an interval to check 'this.stop_typing' periodically
          stopInterval = setInterval(() => {
            if (this.stop_typing === true) {
              console.log('Sound stop');
              audio.pause();
              audio.currentTime = 0;
              clearInterval(stopInterval);
            }
          }, 100); // Check every 100 milliseconds
        };
        this.prevEndedHandler = () => {
          if (this.isMobile()) {
            console.log('This only applies to mobile');
            this.recognition.stop(); // Stop the recognition if mobile detected
            setTimeout(() => { // Use a timeout to ensure stop is fully executed before starting again
              this.recognition.start(); // Restart the recognition
            }, 100);
          }
          resolve();
          if (stopInterval) {
            clearInterval(stopInterval);
          }
        };
        audio.addEventListener('play', this.prevPlayHandler);
        audio.addEventListener('ended', this.prevEndedHandler);
        // audio.addEventListener('play', () => {
        //   this.typeResponse(input);
        // });
        // audio.addEventListener('ended', () => {
        //   resolve();
        // });
        audio.src = url;
        if (!link) {
          this.typeResponse(input); // invoke type response here instead of within play handler (because it can be called multiple times)
        }
        audio.play();
        // // Check whether to stop the audio
        // if (this.stop_typing === true) {
        //   console.log('This has been entered');
        //   audio.pause();
        //   audio.currentTime = 0;
        //   resolve(); // Resolve the promise as audio was intentionally stopped
        // }
        // else {
        //   audio.src = url;
        //   audio.play();
        // }
        this.audio_complete = true;
      } else { // if voice output (speaking functionality) is silenced
        this.typeResponse(input);
        if (this.isMobile()) { // only applies to mobile
          this.recognition.stop();
          setTimeout(() => {
            this.recognition.start();
          }, 100);
        }
        resolve();
      }
    });
  }

  // Function for detecting whether user is on mobile
  isMobile(): boolean {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  }
  // // Function to reload the entire component if user is on mobile
  // reloadComponent() {
  //   // Store the current URL
  //   let currentUrl = this.router.url;

  //   // Use a 'trick' to force a refresh: navigate to an empty path and then navigate back
  //   this.router.navigateByUrl('/', {skipLocationChange: true}).then(() => {
  //     this.router.navigate([currentUrl]);
  //   });
  // }

}
