import { Fulfillment } from '../models/fulfillment.model';

export class FulfillmentService {
    public fulfillment: Fulfillment;
    public matches: any;

    constructor() {
        this.matches = [];
        this.fulfillment = {
            UTTERANCE: 'Press ask a question button',
            FULFILLMENTS: []
        };
    }
    getFulfillment() {
        return this.fulfillment;
    }
    setFulfillments(data) {
        if (data == null) {
            return;
        }
        if (data.UTTERANCE) {
            this.fulfillment.UTTERANCE = data.UTTERANCE;
        } else {
            if (data.PAYLOAD) {
                let payload = JSON.parse(data.PAYLOAD);
                this.matches.push({
                    QUESTION: payload.QUESTION,
                    ANSWER: payload.ANSWER
                });
            } else {
                this.matches.push({
                    QUESTION: data.INTENT_NAME,
                    ANSWER: data.QUERY_TEXT,
                    AUDIO: data.AUDIO
                });
            }
            this.fulfillment.FULFILLMENTS = this.matches;
        }
    }
}
