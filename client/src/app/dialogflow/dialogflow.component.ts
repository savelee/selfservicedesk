import { Component, Injectable, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as io from 'socket.io-client';

@Component({
  selector: 'app-dialogflow',
  templateUrl: './dialogflow.component.html',
  styleUrls: ['./dialogflow.component.scss']
})

@Injectable()
export class DialogflowComponent implements OnInit {
  private url: string;
  public fulfillments: Data[];
  public socket: any;
  public connection;

  constructor(private http: HttpClient) {
    this.socket = io();
    this.socket.binaryType = 'arraybuffer';
    this.fulfillments = [];
  }

  ngOnInit() {
    let me = this;
    console.log(me.fulfillments);
    // When we receive a customer message, display it
    me.socket.on('results', function(data) {
      console.log(data);

      if (data) {
        let obj = {
          INTENT_NAME: data.INTENT_NAME,
          QUERY_TEXT: data.QUERY_TEXT,
          QUESTION: '',
          ANSWER: ''
        };
        if (data.PAYLOAD) {
          let payload = JSON.parse(data.PAYLOAD);
          obj.QUESTION = payload.QUESTION;
          obj.ANSWER = payload.ANSWER;
        }
        me.fulfillments.push(obj);
      }
    });
  }
}

export interface Data {
  INTENT_NAME: string;
  QUERY_TEXT: string;
  QUESTION: string;
  ANSWER: string;
}
