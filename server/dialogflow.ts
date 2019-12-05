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

const df = require('dialogflow').v2beta1;

dotenv.config();

export class Dialogflow {
    private projectId: string;
    private languageCode: string;
    private encoding: string;
    private sampleRateHertz: Number;
    private singleUtterance: Boolean;

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
        console.log(this.projectId);
        console.log(this.sessionId);
        this.sessionPath = this.sessionClient.sessionPath(this.projectId, this.sessionId);
    }

    /*
     * Detect Intent based on Audio Stream
     * @param audio
     * @param cb Callback function to send results
     */
    public async detectStream(audio: any, cb:Function){
      const request = {
        session: this.sessionPath,
        queryInput: {
          audioConfig: {
            sampleRateHertz: this.sampleRateHertz,
            audioEncoding: this.encoding,
            languageCode: this.languageCode,
          },
          singleUtterance: this.singleUtterance
        },
        inputAudio: audio
      };

      console.log(request);
      // Recognizes the speech in the audio and detects its intent.
      const responses = await this.sessionClient.detectIntent(request);
      const contextClient = new df.ContextsClient();
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
      }
      
      cb(result);
    }
}

export let dialogflow = new Dialogflow();
