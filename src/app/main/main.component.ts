import { Component, OnInit, ViewChild, ElementRef, Renderer2, NgZone, OnDestroy } from '@angular/core';
import { environment } from 'src/environments/environment';
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
  ) { }
  @ViewChild('responseCardContainer', { static: false }) responseCardContainer?: ElementRef;
  @ViewChild('inputText', { static: true}) inputElement?:ElementRef; // for placeholder
  typingInterval:any; // Declare a class property to store interval ID
  voice_input: boolean = true; // controls icon change between voice input & typing
  stop_icon: boolean = false; // controls stop button icon
  stop_typing: boolean = false;
  input: string = ''; // typed respone from user
  response: string = ''; // initialize response string
  recognition: any; // for speech recognition
  model_ai: string = 'Jarvis';
  send_command: boolean = false; // flag that decides whether or not to send command
  listenCommand: string = '';

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
    this.recognition = new (window as any).webkitSpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US'; // 'en-US' for English. Use 'zh-CN' for Chinese.

    this.recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const transcript = event.results[i][0].transcript.trim();
          if (this.send_command === true) {
            console.log('Final transcript: ', transcript); // transcript that is final (that should be submitted to chat)
            // place this.chat here
            // update this.input to display the values the user has entered through voice command
            this.send_command = false;
          }
        } else {
          const transcript = event.results[i][0].transcript.trim();
          // this.listenCommand = transcript;
          if (this.model_ai.toLowerCase() === transcript.toLowerCase()) { // if value is equal to name of model_ai
            console.log('I hear you loud and clear sir');
            this.voice_input = true;
            this.send_command = true;
          }
          // console.log('Interim transcript: ', transcript); // transcript that is constantly being typed out
        }
      }
    };
    this.recognition.start();
  }
  // Function to simulate typing animation
  typeResponse(response: string) {
    // console.log('Response container', this.responseCardContainer)
    this.stop_typing = false; // Initialize stop_typing to false
    this.response = ''; // Clear the response first
    let index = 0;
    
    const typingInterval = setInterval(() => {
      this.stop_icon = true;
      if (this.stop_typing) { // check the stop_typing flag
        clearInterval(this.typingInterval); // Stops the animation
        this.stop_icon = false;
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
        this.stop_icon = false;
      }
    }, 25); // Adjust the interval to control typing speed
  }

  // API function call
  async chat(prompt: string, ai: string) {
    try {
      const response = await this.sharedService.openaiChat(prompt, ai);
      this.response = response.choices[0].message.content;
      // Trigger the typing animation
      this.typeResponse(this.response);
    } catch (error) {
      console.log("Something went wrong in chat API call", error);
    }
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
    this.stop_typing = false;
    // console.log('This is the input value:', this.input);
    this.chat(this.input, this.model_ai);
  }
  // switching voice inputs when user clicks on edit text button
  inputSwitch(){
    this.voice_input = false;
  }
  // Destroy the speech recognition element
  ngOnDestroy(): void {
    this.recognition.stop();
  }
}
