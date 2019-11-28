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

import { Component } from '@angular/core';
import * as io from 'socket.io-client';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  private socket: any;

  constructor() {
    this.listen();
    this.speak();
  }

  /**
   * Listen to Websockets
   */
  listen() {
    this.socket = io();
    this.socket.binaryType = 'arraybuffer';

    this.socket.on('connect', function(){
      console.log('socket connection made');
    });
    this.socket.on('disconnect', function(){
      console.log('sockets disconnected');
    });

    this.socket.on('server_setup', function(msg) {
      console.log(msg);
    });

    this.socket.on('broadcast', function(audioBuffer: any) {
      // retrieve audio stream from dialogflow to play

      console.log('=PLAY=============================');
      console.log(audioBuffer);
    });
  }
  /*
  * Start conversation with Dialogflow SDK
  */
  async speak() {
      let me = this;
      window.addEventListener('mic_start', function(e: CustomEvent) {
        let meta = e.detail;
        meta.socket = me.socket.id;
        me.socket.emit('client_meta', meta);
        console.log(meta);
      });
      window.addEventListener('mic_stop', function(e: CustomEvent) {
          me.socket.emit('stop');
      });
      window.addEventListener('mic_rec', function(e: CustomEvent) {
          let audio = e.detail; // ArrayBuffer
          console.log(audio);
          // socket.io binary
          // me.socket.on('returnaudio', function(audioObj: any) {
              // console.log('Client connected over WebSockets');
          // });

          // send mic audio to server
          me.socket.emit('client_audio', audio);
      });
  }
}
