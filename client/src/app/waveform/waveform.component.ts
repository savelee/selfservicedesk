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

import { Component, ViewChild, OnInit, ElementRef } from '@angular/core';
import { FulfillmentService } from '../services/fulfillment.service';
import { Fulfillment } from '../models/fulfillment.model';

@Component({
  selector: 'app-waveform',
  templateUrl: './waveform.component.html',
  styleUrls: ['./waveform.component.scss']
})

export class WaveformComponent implements OnInit {
    @ViewChild('visualizer', { static: false }) canvas: ElementRef;
    public canvasCtx: CanvasRenderingContext2D;
    public fulfillment: Fulfillment;
    public source: MediaStreamAudioSourceNode;
    public audioCtx: AudioContext;
    public distortion: WaveShaperNode;
    public analyser: AnalyserNode;
    public myReq: number;

    constructor(public fulfillmentService: FulfillmentService) {
        this.fulfillment = this.fulfillmentService.getFulfillment();
    }

    ngOnInit() {
        this.audioCtx = new AudioContext();
        this.analyser = this.audioCtx.createAnalyser();
        this.distortion = this.audioCtx.createWaveShaper();
    }

    public start(stream: MediaStream) {
        console.log(stream);
        this.canvasCtx = (<HTMLCanvasElement> this.canvas.nativeElement).getContext('2d');
        this.source = this.audioCtx.createMediaStreamSource(stream);
        this.source.connect(this.analyser);
        this.analyser.connect(this.distortion);
        this.distortion.connect(this.audioCtx.destination);
        this.visualize();
    }

    public stop() {
        this.source.disconnect(this.analyser);
        this.analyser.disconnect(this.distortion);
        this.distortion.disconnect(this.audioCtx.destination);
        cancelAnimationFrame(this.myReq);
    }

    visualize() {
        console.log('visualize');
        let me = this;
        let width = (<HTMLCanvasElement> this.canvas.nativeElement).width;
        let height = (<HTMLCanvasElement> this.canvas.nativeElement).height;
        let bufferLength = this.analyser.frequencyBinCount;
        let dataArray = new Uint8Array(bufferLength);
        me.analyser.fftSize = 2048;
        me.canvasCtx.clearRect(0, 0, width, height);

        function draw() {
            me.myReq = requestAnimationFrame(draw);
            me.analyser.getByteTimeDomainData(dataArray);
            me.canvasCtx.fillStyle = 'rgb(255, 165, 0)';
            me.canvasCtx.fillRect(0, 0, width, height);
            me.canvasCtx.lineWidth = 5;
            me.canvasCtx.strokeStyle = 'rgb(256, 256, 256)';
            me.canvasCtx.beginPath();
            let sliceWidth = width * 1.0 / bufferLength;
            let x = 0;
            for (let i = 0; i < bufferLength; i++) {
                let v = dataArray[i] / 128.0;
                let y = v * height / 2;

                if (i === 0) {
                    me.canvasCtx.moveTo(x, y);
                } else {
                    me.canvasCtx.lineTo(x, y);
                }

                x += sliceWidth;
            }
            me.canvasCtx.lineTo(width, height / 2);
            me.canvasCtx.stroke();
        }
        draw();
    }
}
