import { Injectable, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, Subject, firstValueFrom } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SharedServiceService implements OnInit {
  private userLoggedOut = new Subject<void>();
  public userLoggedOut$ = this.userLoggedOut.asObservable();
  // For changing languages
  private changeLanguage = new BehaviorSubject<any>(null);
  data$= this.changeLanguage.asObservable();
  setData(data:any) { // setting the language
    this.changeLanguage.next(data);
  }

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
      assistant: '鐵雄',
      instructions: `你是科學小飛俠中的鐵雄，請扮演好你的角色!若在答覆過程有提供連結請將連結與談話內容用括號分開，('https://...')，回答請限制在150字內`
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
  // data for about and profile page
  total_tokens = 2500000;
  max_signup = 15;
  private someDataSubject = new BehaviorSubject<any>(false); // sharedData across all pages
  someData$ = this.someDataSubject.asObservable();
  sharedData = {
    firstName: '',
    email: '',
    // password: '',
    details: '',
    authorization: '',
    language: '',
    model: '',
    voice: '',
    speed: '',
    pitch: '',
    prompt: '', // convert to number
    completion: '', // convert to number
    total: '', // conver to number
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
  async openaiChat(prompt: string, assistant: string, model: string = this.model): Promise<any> {
    const instructions = this.modelFinder(assistant); // find corresponding prompts first
    const nameInstructions = `Also, my name is ${this.sharedData.firstName}` // incorporate name within application
    let details = '';
    if (this.sharedData.authorization !== 'User' && this.sharedData.authorization !== 'Member' && this.sharedData.authorization !== 'Anonymous') {
      details = `Here are some facts about me: ${this.sharedData.details}` // incorporate user authorization is 'Pro', 'Admin' etc
    }
    const requestData = {
      model: model,
      messages: [
        { role: 'system', content: instructions + nameInstructions + details },
        { role: 'user', content: prompt }
      ]
    };
    // make the post request by returning promise (signaling API request completion)
    // const observable = this.http.post<any>('https://localhost:3000/talk', requestData);
    const observable = this.http.post<any>('https://backend-dot-nodal-component-399020.wl.r.appspot.com/talk', requestData);
    const response = await firstValueFrom(observable);

    // return new Promise<any>((resolve, reject) => {
      // this.http.post(this.apiUrl, requestData, this.openaioptions).subscribe(
        // (response) => {
          // Handle the successful response here
          // console.log('OpenAI Response:', response);

          // first create an interface for openAIResponse (so it can be recognized as an object with specific properties here)
          interface OpenAIResponse {
            model: string, // gpt-3.5-turbo-0613
            object: string, // chat.completion
            usage: {
              prompt_tokens: number,
              completion_tokens: number,
              total_tokens: number
            }
          }
          const response_obj = response as OpenAIResponse;
          // first read current usage
          const current_prompt = this.sharedData.prompt; // String
          const current_completion = this.sharedData.completion; // String
          const current_total = this.sharedData.total; // String
          const prompt_usage = parseInt(current_prompt, 10) + response_obj.usage.prompt_tokens
          const completion_usage = parseInt(current_completion, 10) + response_obj.usage.completion_tokens
          const total_usage = parseInt(current_total, 10) + response_obj.usage.total_tokens
          const prompt_str = prompt_usage.toString(); // convert back into string
          const completion_str = completion_usage.toString(); // convert back into string
          const total_str = total_usage.toString(); // convert back into string
          // construct json to update usage
          const usage = {
            email: this.sharedData.email,
            prompt: prompt_str,
            completion: completion_str,
            total: total_str
          };
          
          // call backend API
          this.http.post<boolean>('https://backend-dot-nodal-component-399020.wl.r.appspot.com/modifyData', usage)
            .subscribe({
              next: result => {
                if (!result) {
                  console.log('Something went wrong in modifyData, the returned response was not true');
                }
              }
            })
            return response; // return the response so that main can read it

          // resolve(response); // signals that response was successful
        // },
        // (error) => {
          // Handle any errors that occurred during the request
          // console.error('Error making OpenAI request:', error);
          // reject(error); // signals that response was not successful
        // }
      // );
    // });
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
  // function to call whenever a new page requires data from database
  async initializeUserDetails(encoded_email: string): Promise<any> {
    const payload = { email: encoded_email };
    try {
      const observable = this.http.post<any>('https://backend-dot-nodal-component-399020.wl.r.appspot.com/retrieveUserDetails', payload);
      const response = await firstValueFrom(observable); // use await for Promise variables
      if (response !== false) {
        // console.log('Print out the returned data', response);
        this.sharedData.firstName = response.firstName;
        this.sharedData.email = response.email;
        this.sharedData.details = response.details;
        this.sharedData.authorization = response.authorization;
        this.sharedData.language = response.language;
        this.sharedData.model = response.model;
        this.sharedData.voice = response.voice;
        this.sharedData.speed = response.speed;
        this.sharedData.pitch = response.pitch;
        this.sharedData.prompt = response.prompt;
        this.sharedData.completion = response.completion;
        this.sharedData.total = response.total;
        // console.log('This is the shared Data', this.sharedData);
        return this.sharedData; // return object as promise
      } else {
        // Handle the case where response is false
        throw new Error("Response is false"); // or return an alternative value or object
      };
    } catch (error) {
      console.error('Error in initializeUserDetails:', error);
      throw error; // or return a fallback value or object
    }
  };
  // function to retrieve user details (use for every page requiring user data)
  retrieveUserDetails(token: string) {
    this.getUserDetails(token);
    return this.sharedData;
  };
  // function to get user details
  async getUserDetails(token: string) {
    const user_details = await this.initializeUserDetails(token);
    this.sharedData.firstName = user_details.firstName;
    this.sharedData.email = user_details.email;
    this.sharedData.details = user_details.details;
    this.sharedData.authorization = user_details.authorization;
    this.sharedData.language = user_details.language;
    this.sharedData.model = user_details.model;
    this.sharedData.voice = user_details.voice;
    this.sharedData.speed = user_details.speed;
    this.sharedData.pitch = user_details.pitch;
    this.sharedData.prompt = user_details.prompt;
    this.sharedData.completion = user_details.completion;
    this.sharedData.total = user_details.total;
  };

  storeUserDetails(user_data: any) {
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
    this.sharedData.prompt = user_data.data_json.prompt;
    this.sharedData.completion = user_data.data_json.completion;
    this.sharedData.total = user_data.data_json.total;
    // console.log('This is the sharedData', this.sharedData);
  };


  // method that logs out user
  logOutUser() {
    this.userLoggedOut.next();

  }
}
