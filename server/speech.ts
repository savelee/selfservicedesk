const speechToText = require('@google-cloud/speech');
const textToSpeech = require('@google-cloud/text-to-speech');

interface LooseObject {
    [key: string]: any
}

export class Speech {
    private languageCode: string;
    private encoding: string;
    private sampleRateHertz: Number;
    private tts: any;
    private stt: any;
    private ttsRequest: LooseObject;
    private sttRequest: LooseObject;
      
    constructor() {
        this.languageCode = process.env.LANGUAGE_CODE;
        this.encoding = process.env.SPEECH_ENCODING;
        this.sampleRateHertz = parseInt(process.env.SAMPLE_RATE_HERZ);
        this.setupSpeech();
    }

    setupSpeech(){
        this.tts = new textToSpeech.TextToSpeechClient();
        this.stt = new speechToText.SpeechClient();

        this.ttsRequest = {
          // Select the language and SSML Voice Gender (optional)
          voice: {
            languageCode: 'en-US', //https://www.rfc-editor.org/rfc/bcp/bcp47.txt
            ssmlGender: 'NEUTRAL'  //  'MALE|FEMALE|NEUTRAL'
          },
          // Select the type of audio encoding
          audioConfig: {
            audioEncoding: this.encoding, //'LINEAR16|MP3|AUDIO_ENCODING_UNSPECIFIED/OGG_OPUS'
          },
          input: null
        };

        this.sttRequest = {
            config: {
              sampleRateHertz: this.sampleRateHertz,
              encoding: this.encoding,
              languageCode: this.languageCode
            },
            //interimResults: true,
            //enableSpeakerDiarization: true,
            //diarizationSpeakerCount: 2,
            //model: `phone_call`
        };
    }

    async speechToText(audio: AudioBuffer) {
        this.sttRequest.audio = {
            content: audio
        };
        const responses = await this.stt.recognize(this.sttRequest);
        return responses;
    }

    speechStreamToText(stream: any, cb: Function) {
        const recognizeStream = this.stt.streamingRecognize(this.sttRequest)
        .on('data', function(data: any){
          console.log(data);
          cb(data);
        })
        .on('error', (e: any) => {
          console.log(e);
        })
        .on('end', () => {
          console.log('on end');
        });
      
        stream.pipe(recognizeStream);
        stream.on('end', function() {
            //fileWriter.end();
        });
    }

    async textToSpeech(text: string) {
        this.ttsRequest.input = text;
        const responses = await this.tts.synthesizeSpeech(this.ttsRequest);
        return responses[0].audioContent;  
    }

}

export let speech = new Speech();