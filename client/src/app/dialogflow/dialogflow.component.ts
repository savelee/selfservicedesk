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

import { Component, AfterViewInit, EventEmitter, Output } from '@angular/core';
import { FulfillmentService } from '../services/fulfillment.service';
import { IoService } from '../services/io.service';
import { Fulfillment } from '../models/fulfillment.model';
import { EventService } from '../services/event.service';

@Component({
  selector: 'app-dialogflow',
  templateUrl: './dialogflow.component.html',
  styleUrls: ['./dialogflow.component.scss']
})

export class DialogflowComponent implements AfterViewInit {
  public fulfillment: Fulfillment;

  constructor(public fulfillmentService: FulfillmentService, public ioService: IoService, public eventService: EventService) {
    this.fulfillment = this.fulfillmentService.getFulfillment();
  }

  ngAfterViewInit() {
    let me = this;
    me.ioService.receiveStream('results', function(data) {
      me.fulfillmentService.setFulfillments(data);
      if (data && data.AUDIO) {
        me.playOutput(data.AUDIO);
      }
    });

    me.ioService.receiveStream('audio', function(audio) {
      if (audio) {
        me.playOutput(audio);
      }
    });
  }

  /**
   * Text to Speech event, when clicked on a Dialogflow results card
   * @param event event
   */
  textToSpeech(event) {
    let me = this;
    let answerNode = event.target.parentNode.querySelector('.answer');
    let text = answerNode.innerHTML;
    me.eventService.audioPlaying.emit();
    me.ioService.sendMessage('tts', { text });
  }

  /**
   * When Dialogflow matched an intent,
   * return an audio buffer to play this sound output.
   */
  playOutput(arrayBuffer: ArrayBuffer) {
    let audioContext = new AudioContext();
    let outputSource;
    try {
        if (arrayBuffer.byteLength > 0) {
            audioContext.decodeAudioData(arrayBuffer,
            function(buffer) {
                audioContext.resume();
                outputSource = audioContext.createBufferSource();
                outputSource.connect(audioContext.destination);
                outputSource.buffer = buffer;
                outputSource.start(0);
            },
            function() {
                console.log(arguments);
            });
        }
    } catch (e) {
        console.log(e);
    }
  }

}
