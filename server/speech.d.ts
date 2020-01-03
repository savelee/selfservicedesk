export declare class Speech {
    private languageCode;
    private encoding;
    private sampleRateHertz;
    private ssmlGender;
    private tts;
    private stt;
    private ttsRequest;
    private sttRequest;
    constructor();
    setupSpeech(): void;
    speechToText(audio: AudioBuffer): Promise<any>;
    speechStreamToText(stream: any, cb: Function): void;
    textToSpeech(text: string): Promise<any>;
}
export declare let speech: Speech;
