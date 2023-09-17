import { Component, OnInit, ViewChild, ElementRef, Renderer2, NgZone, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Converter } from 'opencc-js'; // for translation purposes (china to taiwan)
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
  constructor(
    private sharedService: SharedServiceService,
    private renderer: Renderer2,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
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
  model_ai: string = 'Friday';
  language: string = 'en-US'; // 'en-US' for English. Use 'zh-TW' for Taiwan Chinese.
  send_command: boolean = false; // flag that decides whether or not to send command
  listenCommand: string = '';
  converter = Converter({ from: 'cn', to: 'tw' }) //  to translate from cn to tw chinese
  voice_output: boolean = true;
  // variables for voice en-GB-Neural2-C cmn-TW-Wavenet-A
  model_name: string = 'en-GB-Neural2-C' // take a look: https://cloud.google.com/text-to-speech/docs/voices
  speed = '1.3';
  pitch = '-2.0';

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
  ngOnInit(): void {
    // Initialize data-placeholder attribute
    this.renderer.setAttribute(this.inputElement?.nativeElement, 'data-placeholder', 'Enter text to chat with AI');
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
          // console.log('Recognition service cycle ended, restarting...');
          this.recognition.start();
        }
      };
      this.recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          let transcript = '';
          if (event.results[i].isFinal) { // for final transcript
            // translate to traditional (taiwan) chinese if language is chinese
            if (this.recognition.lang === 'zh-TW' || this.recognition.lang === 'zh-CN') {
              transcript = this.converter(event.results[i][0].transcript.trim());
            } else {
              transcript = event.results[i][0].transcript.trim();
            }
            if (((this.recognition.lang === 'en-US' || this.recognition.lang === 'en-gb') && this.send_command === true && this.model_ai.toLowerCase() === transcript.split(" ")[0].toLowerCase()) || (this.recognition.lang === 'zh-TW' && this.send_command === true)) {
              this.active_icon = true;
              this.voice_input = true;
              console.log('I hear you loud and clear sir');
              console.log('Final transcript: ', transcript); // transcript that is final (that should be submitted to chat)
              this.input = transcript; // update this.input to display the values the user has entered through voice command
              this.cdr.detectChanges(); // force update in HTML
              this.chat(this.input, this.model_ai); // place this.chat here (COMMENT/UNCOMMENT)
              this.send_command = false;
            }
          } else { // for interim transcript
            // translate to traditional (taiwan) chinese if language is chinese
            if (this.recognition.lang === 'zh-TW' || this.recognition.lang === 'zh-CN') {
              transcript = this.converter(event.results[i][0].transcript.trim());
            } else {
              transcript = event.results[i][0].transcript.trim();
            }
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
    } else {
      // Handle the error or inform the user that their browser is not supported
      console.log("Unfortunately your browser does not support Web Speech API");
    }

  }
  // Function to simulate typing animation
  typeResponse(response: string) {
    // console.log('Response container', this.responseCardContainer)
    this.stop_typing = false; // Initialize stop_typing to false
    this.response = ''; // Clear the response first
    let index = 0;

    const typingInterval = setInterval(() => {
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

        // Use NgZone to make sure the UI gets updated
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
        clearInterval(typingInterval); // Stop the animation when done
        this.stop_icon = false; // stop icon removed once animation has been completed
        this.active_icon = false;
        this.cdr.detectChanges();
      }
    }, 55); // Adjust the interval to control typing speed
  }

  // API function call
  async chat(prompt: string, ai: string) {
    const response = await this.sharedService.openaiChat(prompt, ai);
    if (this.language === 'zh-TW') {
      this.response = this.converter(response.choices[0].message.content)
    } else {
      this.response = response.choices[0].message.content;
    }
    this.fetchAudio(this.response); // response from ChatGPT (and voice)
    // // Trigger the typing animation
    // this.typeResponse(this.response);
  }

  // Chatbox for OpenAI
  chatInput(event: Event) {
    this.input = (event.target as HTMLInputElement).textContent || '';
    // console.log('This is the input value', this.input);
  }

  // Stop text generation
  stop() {
    this.stop_typing = true;
    if (this.typingInterval) {
      clearInterval(this.typingInterval);
    }
  }

  submit() {
    this.stop_typing = false; // set stop_typing to false
    // console.log('This is the input value:', this.input);
    this.chat(this.input, this.model_ai);
  }
  // switching voice inputs when user clicks on edit text button
  inputSwitch() {
    this.voice_input = false;
  }
  // Destroy the speech recognition element
  ngOnDestroy(): void {
    this.recognition.stop();
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
  async fetchAudio(input: string) {
    if (this.voice_output === true) { // if voice output is not silenced
      const res = await fetch(`https://nodal-component-399020.wl.r.appspot.com/speak?text=${input}&languageCode=${this.language}&name=${this.model_name}&speed=${this.speed}&pitch=${this.pitch}`);
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
      audio.addEventListener('play', () => {
        this.typeResponse(this.response);
      });
      audio.src = url;
      audio.play();
    } else { // if voice output (speaking functionality) is silenced
      this.typeResponse(this.response);
    }
  }
}
