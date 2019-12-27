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

import { Component, Input } from '@angular/core';
import { FulfillmentService } from '../services/fulfillment.service';
import { IoService } from '../services/io.service';
import { Fulfillment } from '../models/fulfillment.model';
import { WaveformComponent } from '../waveform/waveform.component';

declare const RecordRTC: any;
declare const StereoAudioRecorder: any;

@Component({
  selector: 'app-microphone',
  templateUrl: './microphone.component.html',
  styleUrls: ['./microphone.component.scss']
})

export class MicrophoneComponent {
    @Input() waveform: WaveformComponent;
    public fullfillment: Fulfillment;
    public utterance: any;
    public recordAudio: any;

    constructor(public fulfillmentService: FulfillmentService, public ioService: IoService) {

      this.fullfillment = this.fulfillmentService.getFulfillment();
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
      }, function(stream: MediaStream) {
          me.waveform.start(stream);
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
              timeSlice: 3000,

              // only for audio track
              audioBitsPerSecond: 128000,

              // used by StereoAudioRecorder
              // the range 22050 to 96000.
              // let us force 16khz recording:
              desiredSampRate: 16000,

              // as soon as the stream is available
              ondataavailable(blob) {
                me.ioService.sendBinaryStream(blob);
              }
          });

          me.recordAudio.startRecording();
          // stopRecording.disabled = false;
      }, function(error) {
          console.error(JSON.stringify(error));
      });
    }

    onStop() {
      // recording stopped
      // startRecording.disabled = false;
      // stopRecording.disabled = true;

      // stop audio recorder
      let me = this;
      me.waveform.stop();
      this.recordAudio.stopRecording(function() {
          // after stopping the audio, get the audio data
          me.recordAudio.getDataURL(function(audioDataURL) {
              let files = {
                  audio: {
                      type: me.recordAudio.getBlob().type || 'audio/wav',
                      dataURL: audioDataURL
                  }
              };
              // submit the audio file to the server
              me.ioService.sendMessage('message', files);
          });
      });
    }
}
