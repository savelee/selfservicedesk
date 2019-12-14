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


import * as dotenv from 'dotenv';
import * as uuid from 'uuid';
import * as pb from 'pb-util';
import * as fs from 'fs';

const util = require('util');
const { Transform, pipeline } = require('stream');
const pump = util.promisify(pipeline);
const df = require('dialogflow').v2beta1;

dotenv.config();

export class Dialogflow {
  private projectId: string;
  private languageCode: string;
  private encoding: string;
  private sampleRateHertz: Number;
  private singleUtterance: Boolean;
  private request: any;
  private sessionClient: any;
  private sessionPath: any;
  private sessionId: string;
    
  constructor() {
      this.languageCode = process.env.LANGUAGE_CODE;
      this.projectId = process.env.PROJECT_ID;
      this.encoding = process.env.ENCODING;
      this.singleUtterance = ((process.env.SINGLE_UTTERANCE == 'true') || true);
      this.sampleRateHertz = (parseInt(process.env.SAMPLE_HERZ) || 44100);
      this.setupDialogflow();
  }

 /*
  * Setup the Dialogflow Agent
  */
  public setupDialogflow() {
      this.sessionId = uuid.v4();
      this.sessionClient = new df.SessionsClient();
      this.sessionPath = this.sessionClient.sessionPath(this.projectId, this.sessionId);

      // Create the initial request object
      // When streaming, this is the first call you will
      // make, a request without the audio stream
      // which prepares Dialogflow in receiving audio
      // with a certain sampleRateHerz, encoding and languageCode
      // this needs to be in line with the audio settings
      // that are set in the client
      
      this.request = {
        session: this.sessionPath,
        queryInput: {
          audioConfig: {
            sampleRateHertz: this.sampleRateHertz,
            audioEncoding: this.encoding,
            languageCode: this.languageCode,
          },
          singleUtterance: this.singleUtterance
        }
      }
  }

 /*
  * Detect Intent based on Audio
  * @param audio file buffer
  * @param cb Callback function to execute with results
  */
  public async detectIntent(audio: any, cb:Function){
    this.request.inputAudio = audio;
    console.log(this.request);
    // Recognizes the speech in the audio and detects its intent.
    const responses = await this.sessionClient.detectIntent(this.request);
    cb(this.getHandleResponses(responses));
  }

 /*
  * Detect Intent based on Audio Stream
  * @param audio stream
  * @param cb Callback function to execute with results
  */
  public async detectIntentStream(audio: any, cb:Function) { 
    const me = this;
    const stream = this.sessionClient.streamingDetectIntent()
      .on('data', function(data: any){
        if (data.recognitionResult) {
          console.log(
            `Intermediate transcript:
            ${data.recognitionResult.transcript}`
          );
        } else {
            console.log(`Detected intent:`);
        }
        cb(data);
      })
      .on('error', (e: any) => {
        console.log(e);
      })
      .on('end', () => {
        console.log('on end');
      });

    // Write request objects.
    // Thee first message must contain StreamingDetectIntentRequest.session, 
    // [StreamingDetectIntentRequest.query_input] plus optionally 
    // [StreamingDetectIntentRequest.query_params]. If the client wants 
    // to receive an audio response, it should also contain 
    // StreamingDetectIntentRequest.output_audio_config. 
    // The message must not contain StreamingDetectIntentRequest.input_audio.
    stream.write(this.request);
    
    // pump is a small node module that pipes streams together and 
    // destroys all of them if one of them closes.
    await pump(
      audio,
      // Format the audio stream into the request format.
      new Transform({
        objectMode: true,
        transform: (obj: any, _: any, next: any) => {
          next(null, { inputAudio: obj });
        }
      }),
      stream
    );
  };

  /*
  * Handle Dialogflow response objects
  * @param responses protobuf
  * @param cb Callback function to send results
  */
  public getHandleResponses(responses: any): any {
    const contextClient = new df.ContextsClient();
    
    if (Array.isArray(responses)) {
      const result = responses[0].queryResult;
      console.log(`  Query: ${result.queryText}`);
      console.log(`  Response: ${result.fulfillmentText}`);
      if (result.intent) {
        console.log(`  Intent: ${result.intent.displayName}`);
      } else {
        console.log(`  No intent matched.`);
      }
      const parameters = JSON.stringify(pb.struct.decode(result.parameters));
      console.log(`  Parameters: ${parameters}`);
      if (result.outputContexts && result.outputContexts.length) {
        console.log(`  Output contexts:`);
        result.outputContexts.forEach(function(context: any) {
          const contextId = contextClient.matchContextFromContextName(context.name);
          const contextParameters = JSON.stringify(
            pb.struct.decode(context.parameters)
          );
          console.log(`    ${contextId}`);
          console.log(`      lifespan: ${context.lifespanCount}`);
          console.log(`      parameters: ${contextParameters}`);
        });
        return result;
    }}
    
  }
}

export let dialogflow = new Dialogflow();
