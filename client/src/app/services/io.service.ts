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

import * as io from 'socket.io-client';

export class IoService {
    public socket: any;
    public socketio: any;
    public lang: string;

    constructor() {
      this.socketio = io();
      this.socket = this.socketio.on('connect', function() {
          console.log('connected');
      });
      this.socket.binaryType = 'arraybuffer';
      this.lang = 'en-US';
    }

    setDefaultLanguage(lang: string) {
        this.lang = lang;
    }

    sendMessage(eventName: string, obj: any) {
        obj.audio.language = this.lang;
        this.socketio.emit(eventName, obj);
    }

    receiveStream(eventName: string, callback: any) {
        this.socket.on(eventName, function(data) {
            callback(data);
        });
    }
}
