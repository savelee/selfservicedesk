import { Injectable} from '@angular/core';
import { Fulfillment } from '../models/fulfillment.model';
import { Observable, of } from 'rxjs';

@Injectable({
    // we declare that this service should be created
    // by the root application injector.
    providedIn: 'root',
  })
export class FulfillmentService {
    public fulfillment: Fulfillment;
    public matches: any;
    connect(): Observable<Fulfillment> {
        return of(this.fulfillment);
    }

    constructor() {
        console.log('reset');
        this.matches = [];
        this.fulfillment = {
            UTTERANCE: 'press record',
            FULFILLMENTS: []
        };
    }
    getFulfillment() {
        console.log(this.fulfillment);
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
                    ANSWER: data.QUERY_TEXT
                });
            }
            this.fulfillment.FULFILLMENTS = this.matches;
        }
    }
}
