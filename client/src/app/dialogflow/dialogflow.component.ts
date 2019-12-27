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

import { Component, AfterViewInit } from '@angular/core';
import { FulfillmentService } from '../services/fulfillment.service';
import { IoService } from '../services/io.service';
import { Fulfillment } from '../models/fulfillment.model';

@Component({
  selector: 'app-dialogflow',
  templateUrl: './dialogflow.component.html',
  styleUrls: ['./dialogflow.component.scss']
})

export class DialogflowComponent implements AfterViewInit {
  public fulfillment: Fulfillment;

  constructor(public fulfillmentService: FulfillmentService, public ioService: IoService) {
    this.fulfillment = this.fulfillmentService.getFulfillment();
  }

  ngAfterViewInit() {
    let me = this;
    me.ioService.receiveStream('results', function(data) {
      console.log('incoming data');
      me.fulfillmentService.setFulfillments(data);
    });
  }
}
