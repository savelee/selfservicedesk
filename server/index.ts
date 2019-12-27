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
import { dialogflow } from './dialogflow';
import * as socketIo from 'socket.io';
import * as path from 'path';
import * as fs from 'fs';
import * as http from 'http';
import * as express from 'express';
import * as cors from 'cors';
import * as sourceMapSupport from 'source-map-support';

const ss = require('socket.io-stream');

dotenv.config();
sourceMapSupport.install();

export class App {
    public static readonly PORT:number = parseInt(process.env.PORT) || 8080;
    private app: express.Application;
    private server: http.Server;
    private io: SocketIO.Server;
    public socketClient: SocketIO.Server;
    
    constructor() {
        this.createApp();
        this.createServer();
        this.sockets();
        this.listen();
    }

    private createApp(): void {
        this.app = express();
        this.app.use(cors());
  
        this.app.use(function(req: any, res: any, next: any) {
            res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
            next();
            //console.log(req);
        });
        this.app.use('/', express.static(path.join(__dirname, '../dist/public')));
    }

    private createServer(): void {
        this.server = http.createServer(this.app);
    }

    private sockets(): void {
        this.io = socketIo(this.server);
    }

    private listen(): void {
        let me = this;
        this.server.listen(App.PORT, () => {
            console.log('Running server on port %s', App.PORT);
        });

        this.io.on('connect', (client: any) => {
            this.socketClient = client;
            console.log(`Client connected [id=${client.id}]`);
            client.emit('server_setup', `Server connected [id=${client.id}]`);

            client.on('message', function (results: any) {
                // me.prepareAudioDetection(results.audio.dataURL);
                // client.emit('results', results);
            });

            var me = this;
            ss(client).on('stream', function(stream: any, data: any) {
                
                var filename = path.basename(data.name);
                stream.pipe(fs.createWriteStream(filename));
                
                dialogflow.detectIntentStream(stream, function(results: any){
                    console.log(results);
                    me.socketClient.emit('results', results);
                });
            
                stream.on('data', function(chunk: any){
                    // console.log(chunk);
                });
                stream.on('end', function () {
                    //console.log('end');
                });

            });
        });
    }

    public prepareAudioDetection(dataURL: string): void {
        dataURL = dataURL.split(',').pop();
        let fileBuffer = Buffer.from(dataURL, 'base64');

        dialogflow.detectIntent(fileBuffer, function(results: any){
            console.log(results);
        });
    }
}

export let app = new App();
