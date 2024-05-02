// let _ = require("lodash");
// let moment = require("moment");
// let analyticModel = require("./schema/analytic.schema");
// let DB = require("./db-crud");
// const CONFIG = require("../config/server.config");

import _ from 'lodash';
import moment, { Moment } from 'moment';

import analyticModel from './schema/analytic.schema';
import DB from './db-crud';
import { HTTP_CODE } from '../config/server.config'; 


export default class Analytic {
    constructor(
        private clientId: string, 
        private date: Moment, 
        private eventName: string){
        this.clientId = clientId;
        this.date = date ? date : moment.utc();
        this.eventName = _.toUpper(eventName);
    }

    getClientId(){return this.clientId;}
    getDate(){return this.date;}
    getEventName(){return this.eventName;}

    setClientId(clientId){this.clientId = clientId;}
    setDate(date){this.date = date;}
    setEventName(eventName){this.eventName = eventName;}


    getAnalyticModelStruct(){
        return new analyticModel({
            clientId: this.clientId,
            date: this.date,
            eventName: this.eventName
        });
    }

    getStruct(){
        return {
            clientId: this.clientId,
            date: this.date,
            eventName: this.eventName
        };
    }

    async saveToDB(){
        try {
            let result = await DB.postToDB(this.getAnalyticModelStruct());
            return Promise.resolve({
                success: true, 
                data: result
            });
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

module.exports = Analytic;