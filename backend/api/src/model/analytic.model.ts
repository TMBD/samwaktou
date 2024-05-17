import _ from 'lodash';
import moment, { Moment } from 'moment';
import { Types } from 'mongoose';

import AnalyticModel from './schema/analytic.schema';
import DB, { IDocumentId } from './db-crud';
import { HTTP_CODE } from '../config/server.config'; 


export type EventName = 'PAGE_LOAD' | 'START_LISTENING_AUDIO' | 'AUDIO_DOWNLOADED';

interface IAnalytic {
    clientId: string, 
    date?: Moment, 
    eventName: EventName
}

export interface IAnalyticObject extends IAnalytic {
    id: string;

    saveToDB(): Promise<IAnalyticObject>;
}

export interface IAnalyticDoc extends IAnalytic, IDocumentId {}

export interface IAnalyticLight {
    clientId: string, 
    date?: string, 
    eventName: EventName,
    id?: string
}

export default class Analytic implements IAnalyticObject {
    constructor(
        public clientId: string, 
        public date: Moment, 
        public eventName: EventName,
        public id: string){
        this.clientId = clientId;
        this.date = date ? date : moment.utc();
        this.eventName = eventName;
        this.id = id;
    }

    get getClientId(){return this.clientId;}
    get getDate(){return this.date;}
    get getEventName(){return this.eventName;}
    get getId(){return this.id;}

    set setClientId(clientId: string){this.clientId = clientId;}
    set setDate(date: Moment){this.date = date;}
    set setEventName(eventName: EventName){this.eventName = eventName;}
    set setId(id: string){this.id = id;}

    public static toAnalytic(doc: IAnalyticDoc): IAnalyticObject{
        return new Analytic(doc.clientId, doc.date, doc.eventName, doc._id.toString());
    };

    getAnalyticModelStruct(){
        return new AnalyticModel<IAnalyticDoc>({
            clientId: this.clientId,
            date: this.date,
            eventName: this.eventName,
            _id: new Types.ObjectId(this.id)
        });
    }

    async saveToDB(): Promise<IAnalyticObject>{
        try {
            const result = await DB.postToDB<IAnalyticDoc>(this.getAnalyticModelStruct());
            return Promise.resolve(Analytic.toAnalytic(result.data));
        } catch (saveError) {
            return Promise.reject({
                success: false,
                reason: "Couldn't save the analytic to the database",
                message: "Une erreur s'est produite lors de l'enregistrement des informations.",
                details: saveError,
                httpCode: HTTP_CODE.INTERNAL_SERVER_ERROR
            });
        }
    }
}