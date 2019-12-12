/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import { Component, OnInit } from '@angular/core';
import { addClass, addMultipleEventListener } from '../helpers/helpers';
import { HttpClient } from '@angular/common/http';
import { convertFloat32ToInt16 } from '../helpers/helpers';
import * as io from 'socket.io-client';

declare const RecordRTC: any;
declare const StereoAudioRecorder: any;
declare const ss: any;

const SELECTORS = {
  AUDIO_ELEMENT: '.audio_element',
  MIC_RECORD_BUTTON: '.mic_button',
  START_RECORD_BUTTON: '.start_btn',
  STOP_RECORD_BUTTON: '.stop_btn',
};

@Component({
  selector: 'app-microphone',
  templateUrl: './microphone.component.html',
  styleUrls: ['./microphone.component.scss']
})

/** Initializes and manages interaction with the camera */
export class MicrophoneComponent implements OnInit {
    public recordAudio: any;
    socket: any;
    socketio: any;

    constructor(private http: HttpClient) {
      this.http = http;

      this.socketio = io();
      this.socket = this.socketio.on('connect', function() {
          // reset the recorder
          // startRecording.disabled = false;
      });
    
      // const startRecording = document.getElementById('start-recording');
      // const stopRecording = document.getElementById('stop-recording');
  }

  ngOnInit() {
   // this.recordButton = <HTMLElement> document.querySelector(SELECTORS.MIC_RECORD_BUTTON);
    // this.startButton = <HTMLElement> document.querySelector(SELECTORS.START_RECORD_BUTTON);
    // this.stopButton = <HTMLElement> document.querySelector(SELECTORS.STOP_RECORD_BUTTON);
    
    //bthis.setupButtons();
    console.log(RecordRTC);
  }

  /*
  setupButtons() {
    let me = this;

    addMultipleEventListener(this.recordButton,
      ['touchstart', 'mousedown'], async function(e: Event) {
        e.preventDefault();

    });
    addMultipleEventListener(this.recordButton,
      ['touchend', 'mouseup'], function(e: Event) {
        e.preventDefault();
    });
    addMultipleEventListener(this.recordButton,
      ['touchcancel', 'touchmove'], function(e: Event) {
        e.preventDefault();
    });
  }*/

  onStart() {
    // recording started
    // startRecording.disabled = true;
    let me = this;
    // make use of HTML 5/WebRTC, JavaScript getUserMedia()
    // to capture the browser microphone stream
    navigator.getUserMedia({
        audio: true
    }, function(stream) {
        me.recordAudio = RecordRTC(stream, {
            type: 'audio',
            mimeType: 'audio/webm',
            sampleRate: 44100, // this sampleRate should be the same in your server code

            // MediaStreamRecorder, StereoAudioRecorder, WebAssemblyRecorder
            // CanvasRecorder, GifRecorder, WhammyRecorder
            recorderType: StereoAudioRecorder,

            // Dialogflow / STT requires mono audio
            numberOfAudioChannels: 1,

            // get intervals based blobs
            // value in milliseconds
            // as you might not want to make detect calls every seconds
            timeSlice: 5000,

            // as soon as the stream is available
            ondataavailable: function(blob) {
                // making use of socket.io-stream for bi-directional
                // streaming, create a stream
                const stream = ss.createStream();
                // stream directly to server
                // it will be temp. stored locally
                ss(me.socket).emit('stream', stream, {
                    name: '../_temp/stream.wav',
                    size: blob.size
                });
                // pipe the audio blob to the read stream
                ss.createBlobReadStream(blob).pipe(stream);
            }
        });
        

        me.recordAudio.startRecording();
        // stopRecording.disabled = false;
    }, function(error) {
        console.error(JSON.stringify(error));
    });
  }

  onStop(){
     // recording stopped
     // startRecording.disabled = false;
     // stopRecording.disabled = true;

     // stop audio recorder
     let me = this;
     this.recordAudio.stopRecording(function() {

         // after stopping the audio, get the audio data
         me.recordAudio.getDataURL(function(audioDataURL) {
             var files = {
                 audio: {
                     type: me.recordAudio.getBlob().type || 'audio/wav',
                     dataURL: audioDataURL
                 }
             };
             // submit the audio file to the server
             me.socketio.emit('message', files);
         });
     });
  }
}
