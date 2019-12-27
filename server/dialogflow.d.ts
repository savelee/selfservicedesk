export declare class Dialogflow {
    private projectId;
    private languageCode;
    private encoding;
    private sampleRateHertz;
    private singleUtterance;
    private request;
    private sessionClient;
    private sessionPath;
    private sessionId;
    constructor();
    setupDialogflow(): void;
    detectIntent(audio: any, cb: Function): Promise<void>;
    detectIntentStream(audio: any, cb: Function): Promise<void>;
    getHandleResponses(responses: any): any;
}
export declare let dialogflow: Dialogflow;
