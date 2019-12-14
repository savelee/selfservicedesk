import { Component, Injectable, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
// import { Observable, of } from 'rxjs';
import * as io from 'socket.io-client';

@Component({
  selector: 'app-dialogflow',
  templateUrl: './dialogflow.component.html',
  styleUrls: ['./dialogflow.component.scss']
})

@Injectable()
export class DialogflowComponent implements OnInit {
  private url: string;
  public fulfillmentText: string;
  public socket: any;
  public connection;

  constructor(private http: HttpClient) {
    this.socket = io();
    this.socket.binaryType = 'arraybuffer';
  }

  ngOnInit() {
    let me = this;

    // When we receive a customer message, display it
    me.socket.on('results', function(data) {
      console.log(data);
      if (data.queryResult) {
        me.fulfillmentText = data.queryResult.fulfillmentText;
      }
    });

    /*me.connection = this.observeDialogflowQueryResults().subscribe(data => {
      console.log(data);
      if (data.queryResult) {
        me.fulfillmentText = data.queryResult.fulfillmentText;
      }
    });*/
  }

  /*observeDialogflowQueryResults() {
    const me = this;
    const observable = new Observable<any>(observer => {
      // When we receive a customer message, display it
      me.socket.on('results', function(values: any) {
        observer.next(values);
      });
      return () => {
        me.socket.disconnect();
      };
    });
    return observable;
  }*/

}
