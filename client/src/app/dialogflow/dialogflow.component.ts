declare function require(name: string);
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
const Dialogflow = require('../../../pbjs-genfiles/proto').google.cloud.dialogflow.v2beta1;
// const { DialogflowServiceClient } = require('../../../pbjs-genfiles/web_pb.js');

@Component({
  selector: 'app-dialogflow',
  templateUrl: './dialogflow.component.html',
  styleUrls: ['./dialogflow.component.scss']
})
export class DialogflowComponent implements OnInit {
  private jwt: any;
  private response: any;
  private languageCode: string;
  private detectIntentUrl: string;
  private detectStreamUrl: string;
  private projectId: string;

  constructor(private http: HttpClient) {
    this.languageCode = 'en-GB';
    this.projectId = 'selfservicedesk'; // TODO get from token
    this.detectIntentUrl = 'https://dialogflow.googleapis.com/$rpc/google.cloud.dialogflow.v2beta1.Sessions/DetectIntent';
    // this.detectIntentUrl = 'https://dialogflow.googleapis.com/v2/{session=projects/*/agent/sessions/*}:detect';
    this.detectStreamUrl = 'https://dialogflow.googleapis.com/$rpc/google.cloud.dialogflow.v2beta1.Sessions/StreamingDetectIntent';

    this.jwt = this.http.get('/auth').subscribe(data => {
      console.log(data);

      this.grpcService();
    });
    //console.log(this.http.get('/auth').subscribe(data => console.log(data)));
  }

  ngOnInit() {
    // this.detectIntent();
  }

  rpcImpl(method, requestData, callback) {
    // perform the request using an HTTP request or a WebSocket for example
    const responseData = {test: 'test'};
    // and call the callback with the binary response afterwards:
    callback(null, responseData);
  }

  grpcService() {
    const headers = {
      authorization: `Bearer ya29.c.KmCzB3uE8YVcOe_o_KLaOU4CQseH_rQwlvYmXSpCY0fn9TqUDkie4OJXrY8sn45SrHe-YdCAXkC-Grpy73YG4U3sk3LMtcY8h9JO3o9xOHOVLMER45ZkCvJHACwK5GUmUlY`,
    };
    headers['Content-Type'] = 'application/x-protobuf';

    const stub = Dialogflow.Sessions.create(this.rpcImpl);
    stub.DetectIntentRequest({
      session: `projects/${this.projectId}/agent/sessions/mysessionid`,
      queryInput: {
          text: {
            text: 'Hello, how are you doing?',
            languageCode: this.languageCode
          }
        }
    });

    console.log(stub);

  }

  detectIntent() {
    console.log('in here');
    const headers = {
      authorization: `Bearer ya29.c.KmCzB3uE8YVcOe_o_KLaOU4CQseH_rQwlvYmXSpCY0fn9TqUDkie4OJXrY8sn45SrHe-YdCAXkC-Grpy73YG4U3sk3LMtcY8h9JO3o9xOHOVLMER45ZkCvJHACwK5GUmUlY`,
    };
    headers['Content-Type'] = 'application/x-protobuf';

    console.log('Headers :');
    console.log(headers);

    // the formatted requests, based on the specs in the documentation
    const request = Dialogflow.DetectIntentRequest.fromObject({
      session: `projects/${this.projectId}/agent/sessions/mysessionid`,
      queryInput: {
          text: {
            text: 'Hello, how are you doing?',
            languageCode: this.languageCode
          }
        }
    });
    console.log(request);

    // encode the request to a request buffer, by using the encode helper
    // method, part of the generated Proto.
    const requestBuffer = Dialogflow.DetectIntentRequest.encode(
      request
    ).finish();

    this.response = this.http.post(this.detectIntentUrl, {
      headers,
      body: requestBuffer
    }).subscribe(data => {
      // console.log(data);
      const responseArrayBuffer = this.response.arrayBuffer();
      console.log(responseArrayBuffer);
      // const response = Dialogflow.DetectIntentResponse.decode(
        // Buffer.from(responseArrayBuffer)
      //);
      // console.log(response);

    });

  }


}
