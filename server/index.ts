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
import * as uuid from 'uuid';
import * as url from 'url';
import * as http from 'http';
//import * as cors from 'cors';

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
                var fileName = uuid.v4();
                me.writeToDisk(data.audio.dataURL, fileName + '.wav');
            });
        });
    }

    public writeToDisk(dataURL: string, fileName: any): void {
        let fileExtension = fileName.split('.').pop(),
        fileRootNameWithBase = path.join(__dirname, '..', 'upload', fileName),
        filePath = fileRootNameWithBase,
        fileID = 2,
        fileBuffer;

        // @todo return the new filename to client
        while (fs.existsSync(filePath)) {
            filePath = fileRootNameWithBase + '(' + fileID + ').' + fileExtension;
            fileID += 1;
        }

        dataURL = dataURL.split(',').pop();
        fileBuffer = Buffer.from(dataURL, 'base64');
        console.log('filePath', filePath);
        console.log(fileBuffer);

        console.log(dialogflow);

        dialogflow.detectStream(fileBuffer, function(results: any){
            console.log(results);
        });

        fs.writeFileSync(filePath, fileBuffer);

        console.log('filePath', filePath);
    }
}

export let app = new App();
