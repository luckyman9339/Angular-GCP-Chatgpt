import { Component, OnInit, ViewChild, ElementRef, Renderer2, NgZone } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SharedServiceService } from '../shared-service.service';
import { OpenAI } from 'openai'; // request openai

import { trigger, state, style, transition, animate } from '@angular/animations';

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
export class MainComponent implements OnInit {
  constructor (
    private sharedService: SharedServiceService,
    private renderer: Renderer2,
    private ngZone: NgZone
    ) { }
  @ViewChild('responseCardContainer', { static: false }) responseCardContainer?: ElementRef;
  input: string = '';
  response: string = ''; // initialize response string
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
      this.response = this.generateRandomResponse();
  }
  // Function to simulate typing animation
  typeResponse(response: string) {
    // console.log('Response container', this.responseCardContainer)
    this.response = ''; // Clear the response first
    let index = 0;
    const typingInterval = setInterval(() => {
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
      }
    }, 25); // Adjust the interval to control typing speed
  }

  // API function call
  async chat (prompt: string, ai: string) {
    try{
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
    this.input = (event.target as HTMLInputElement).value;
  }

  submit() {
    // console.log('This is the input value:', this.input);
    this.chat(this.input, 'Jarvis');
  }

}
