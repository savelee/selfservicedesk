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
import * as url from 'url';
import * as http from 'http';

const ss = require('socket.io-stream');

dotenv.config();

import * as sourceMapSupport from 'source-map-support';
sourceMapSupport.install();

export class App {
    public static readonly PORT:number = parseInt(process.env.PORT) || 9001;
    private server: any;
    private io: SocketIO.Server;
    
    constructor() {
        this.createServer();
        this.sockets();
        this.listen();
    }

    private createServer(): void {

        this.server = http.createServer(function (request, response) {
            var uri = url.parse(request.url).pathname,
              filename = path.join(process.cwd(), uri);

              fs.exists(filename, function (exists) {
                if (!exists) {
                    response.writeHead(404, {
                        "Content-Type": "text/plain"
                    });
                    response.write('404 Not Found: ' + filename + '\n');
                    response.end();
                    return;
                }
              });

              if (fs.statSync(filename).isDirectory()) filename += '../dist/index.html';

              fs.readFile(filename, 'binary', function (err, file) {
                if (err) {
                    response.writeHead(500, {
                        "Content-Type": "text/plain"
                    });
                    response.write(err + "\n");
                    response.end();
                    return;
                }
    
                response.writeHead(200);
                response.write(file, 'binary');
                response.end();
            });

        });
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
            console.log(`Client connected [id=${client.id}]`);
            client.emit('server_setup', `Server connected [id=${client.id}]`);

            client.on('message', function (data: any) {
                //me.prepareAudioDetection(data.audio.dataURL);
            });

            ss(client).on('stream', function(stream: any, data: any) {
                var filename = path.basename(data.name);
                stream.pipe(fs.createWriteStream(filename));

                dialogflow.detectIntentStream(stream, function(result: any){
                    console.log(result);
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
