import { translate } from "./translate";

const speechToText = require('@google-cloud/speech');
const textToSpeech = require('@google-cloud/text-to-speech');

interface LooseObject {
    [key: string]: any
}

export class Speech {
    private languageCode: string;
    private encoding: string;
    private sampleRateHertz: Number;
    private ssmlGender: string;
    private tts: any;
    private stt: any;
    private ttsRequest: LooseObject;
    private sttRequest: LooseObject;
      
    constructor() {
        this.languageCode = process.env.LANGUAGE_CODE;
        this.encoding = process.env.SPEECH_ENCODING;
        this.sampleRateHertz = parseInt(process.env.SAMPLE_RATE_HERZ);
        this.ssmlGender = process.env.SSML_GENDER;
        this.setupSpeech();
    }

    setupSpeech(){
        this.tts = new textToSpeech.TextToSpeechClient();
        this.stt = new speechToText.SpeechClient();

        this.ttsRequest = {
          // Select the language and SSML Voice Gender (optional)
          voice: {
            ssmlGender: this.ssmlGender  //  'MALE|FEMALE|NEUTRAL'
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
            },
            //interimResults: true,
            //enableSpeakerDiarization: true,
            //diarizationSpeakerCount: 2,
            //model: `phone_call`
        };
    }

    async speechToText(audio: Buffer, lang: string) {
        this.sttRequest.config.languageCode = lang;
        this.sttRequest.audio = {
            content: audio,
        };

        const responses = await this.stt.recognize(this.sttRequest);
        const results = responses[0].results[0].alternatives[0];
        return {
            'transcript' : results.transcript,
            'detectLang': lang
        };
    }

    async textToSpeech(text: string, lang: string) {
        this.ttsRequest.input = { text };
        this.ttsRequest.voice.languageCode = lang;
        const responses = await this.tts.synthesizeSpeech(this.ttsRequest);
        return responses[0].audioContent;  
    }

}

export let speech = new Speech();