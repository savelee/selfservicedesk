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

declare var MediaRecorder: any;

const SELECTORS = {
  AUDIO_ELEMENT: '.audio_element',
  MIC_RECORD_BUTTON: '.mic_button'
};

@Component({
  selector: 'app-microphone',
  templateUrl: './microphone.component.html',
  styleUrls: ['./microphone.component.scss']
})

/** Initializes and manages interaction with the camera */
export class MicrophoneComponent implements OnInit {

    /** The HTMLAudioElement used to play audio from the microphone */
    audioElement: HTMLAudioElement;
    recordButton: HTMLElement;
    microphonePaused: boolean;
    audioContext: any;
    outputChunks: Array<any>;
    mediaStream: any;
    mediaRecorder: any;
    meta: {
      sampleHerz: number,
      channels: number
    };
    source: MediaStreamAudioSourceNode;
    outputSource: AudioBufferSourceNode;
    scriptProcessor: ScriptProcessorNode;
    // fileElement: HTMLElement;
    // fileReader: any;

    constructor(private http: HttpClient) {
      this.microphonePaused = false;
      this.mediaStream = null;
      this.outputChunks = [];
      this.http = http;

      // this.fileReader = new FileReader();
    }

  ngOnInit() {
    this.recordButton = <HTMLElement> document.querySelector(SELECTORS.MIC_RECORD_BUTTON);
    this.setupButtons();
  }

  /**
   * Requests access to the microphone
   *
   * @async
   */
  async setupMicrophone() {
    let me = this;
    me.audioContext = new AudioContext();

    me.audioElement = <HTMLAudioElement> document.querySelector(SELECTORS.AUDIO_ELEMENT);
    me.meta = {
      sampleHerz: me.audioContext.sampleRate,
      channels: me.audioContext.destination.numberOfInputs
    };

    await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: 'mic'
      }
    }).then(function(s: MediaStream) {
          me.mediaStream = s;
          me.mediaRecorder = new MediaRecorder(me.mediaStream);
          me.getMicStream();

          me.mediaRecorder.addEventListener('start', (e: any) => {
            me.outputChunks = [];
            let event = new CustomEvent('start', {
              detail: 'start'
            });
            window.dispatchEvent(event);

            me.source = me.audioContext.createMediaStreamSource(me.mediaStream);
            me.source.connect(me.scriptProcessor);
            me.scriptProcessor.connect(me.audioContext.destination);
          });

          me.mediaRecorder.addEventListener('stop', (e: any) => {
            // TODO problem in IOS
            // after you disconnect the audionode and script processor
            // the buffer will be nulled out.
            me.source.disconnect(me.scriptProcessor);
            me.scriptProcessor.disconnect(me.audioContext.destination);
          });
    }).catch(function(e) {
      console.log(e);
    });

    return new Promise(resolve => {
      resolve(me.meta);
    });
  }

  setupButtons() {
    let me = this;

    addMultipleEventListener(this.recordButton,
      ['touchstart', 'mousedown'], async function(e: Event) {
        e.preventDefault();
        let meta = await me.setupMicrophone();
        addClass(me.recordButton, 'active');
        me.mediaRecorder.start();
        let event = new CustomEvent('mic_start', {
          detail: meta
        });
        window.dispatchEvent(event);
    });
    addMultipleEventListener(this.recordButton,
      ['touchend', 'mouseup'], function(e: Event) {
        e.preventDefault();
        me.recordButton.classList.remove('active');
        me.mediaRecorder.stop();
        let event = new CustomEvent('mic_stop', {
          detail: 'stop'
        });
        window.dispatchEvent(event);
    });
    addMultipleEventListener(this.recordButton,
      ['touchcancel', 'touchmove'], function(e: Event) {
        e.preventDefault();
    });
  }

  getMicStream() {
    const me = this;
    const bufferLength = 4096;
    me.source = me.audioContext.createMediaStreamSource(me.mediaStream);
    me.scriptProcessor =
      me.audioContext.createScriptProcessor(bufferLength, 1, 1);

    this.scriptProcessor.onaudioprocess = (e) => {

      // console.log(e.inputBuffer.getChannelData(0));
      let stream = e.inputBuffer.getChannelData(0) ||
      new Float32Array(bufferLength);

      // TODO this is the problem, the 2nd time,
      // after starting the recording processor
      // the buffer is empty.
      // this happens after this connecting

      let event = new CustomEvent('mic_rec', {
        detail: convertFloat32ToInt16(stream)
      });
      window.dispatchEvent(event);
    };
  }
}
