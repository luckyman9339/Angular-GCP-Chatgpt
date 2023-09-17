import { Injectable, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SharedServiceService implements OnInit {
  private userLoggedOut = new Subject<void>();
  public userLoggedOut$ = this.userLoggedOut.asObservable();
  // // constructing custom JSON object
  // aiObject:JSON;
  ai = [
    {
      assistant: 'None',
      instructions: `Reply in a concise manner, less than 50 words`
    },
    {
      assistant: '電腦',
      instructions: `你的稱呼是電腦，若在答覆過程有提供連結請將連結與談話內容用括號分開，('https://...')，回答請限制在150字內`
    },
    {
      assistant: 'Jarvis',
      instructions: "Please reply like Jarvis from the MCU when replying to the user's prompts, limit responses to less than or around 50 words"
    },
    {
      assistant: 'Edith',
      instructions: "Please reply like Peter Parker's AI Edith (from the MCU) when replying to the user's prompts, limit responses to less than or around 50 words"
    },
    {
      assistant: 'Friday',
      instructions: "Please reply like Tony Stark's AI Friday when replying to the user's prompts, limit responses to less than or around 50 words"
    }
  ]
  constructor(private http: HttpClient) {
    // this.aiObject=<JSON>this.ai;
  }
  private someDataSubject = new BehaviorSubject<any>(false); // sharedData across all pages
  someData$ = this.someDataSubject.asObservable();
  sharedData = {
    firstName: '',
    email: '',
    password: '',
    details: '',
    authorization: '',
    language: '',
    model: '',
    voice: '',
    speed: '',
    pitch: ''
  };
  ngOnInit(): void { 

  }

  open_apikey = environment.OPENAI_API_KEY;
  model: string = 'gpt-3.5-turbo';

  apiUrl: string = 'https://api.openai.com/v1/chat/completions'; // set openAI API Url
  openaioptions: Object = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.open_apikey}`
    })
  }
  // method for finding the correct system prompt
  modelFinder(assistant: string) {
    const foundIndex = this.ai.findIndex(item => item.assistant === assistant);

    if (foundIndex !== -1) {
      // The assistant was found, and foundIndex contains the index
      const instructions = this.ai[foundIndex].instructions;
      // console.log('This is the corresponding instructions', instructions);
      return instructions;
    } else {
      // The assistant was not found
      console.log('Assistant not found');
      return this.ai[0].instructions;

    }
  }

  // method for calling openaiChat
  openaiChat(prompt: string, assistant: string, model: string = this.model): Promise<any> {
    const instructions = this.modelFinder(assistant); // find corresponding prompts first
    const nameInstructions = `Also, my name is ${this.sharedData.firstName}` // name
    const details = `Here are some facts about me: ${this.sharedData.details}` // incorporate if need be
    const requestData = {
      model: model,
      messages: [
        { role: 'system', content: instructions + nameInstructions },
        { role: 'user', content: prompt }
      ]
    };
    // make the post request by returning promise (signaling API request completion)
    return new Promise<any>((resolve, reject) => {
      this.http.post(this.apiUrl, requestData, this.openaioptions).subscribe(
        (response) => {
          // Handle the successful response here
          // console.log('OpenAI Response:', response);
          resolve(response); // signals that response was successful
        },
        (error) => {
          // Handle any errors that occurred during the request
          console.error('Error making OpenAI request:', error);
          reject(error); // signals that response was not successful
        }
      );
    });
  }

  // specifically for showing hamburger menu after logging in
  updateData(data: any) {
    this.someDataSubject.next(data);
  }
  // // method for remembering user first name
  // updateUserName(name: string) {
  //   const encodedName = btoa(name);
  //   // console.log('This is the encodedName', encodedName);
  //   this.sharedData = {
  //     firstName: name,
  //     encoder: encodedName
  //   }
  // }

  storeUserDetails(user_data:any) {
    // console.log('This is the user data:', user_data.data_json);
    this.sharedData.firstName = user_data.data_json.firstName;
    this.sharedData.email = user_data.data_json.email;
    this.sharedData.details = user_data.data_json.details;
    this.sharedData.authorization = user_data.data_json.authorization;
    this.sharedData.language = user_data.data_json.language;
    this.sharedData.model = user_data.data_json.model;
    this.sharedData.voice = user_data.data_json.voice;
    this.sharedData.speed = user_data.data_json.speed;
    this.sharedData.pitch = user_data.data_json.pitch;
    // console.log('This is the sharedData', this.sharedData);
  };


  // method that logs out user
  logOutUser() {
    this.userLoggedOut.next();
  }
}
