import _ from 'lodash';
import moment, { Moment } from 'moment';
import { Types } from 'mongoose';
import { DeleteResult } from 'mongodb';

import AudioModel from './schema/audio.schema';
import DB, { IDocumentId, IUpdateOne } from './db-crud';
import { HTTP_CODE, FILE_LOCATION, DATE_CONFIG } from '../config/server.config';


interface IAudio {
    uri: string, 
    theme: string, 
    author: string, 
    description: string, 
    keywords: string, 
    date: Moment
}

export interface IAudioObject extends IAudio {
    id: string;
    
    saveToDB(): Promise<IAudioObject>;
    updateToDB(): Promise<IUpdateOne>;
    deleteFromDB(): Promise<DeleteResult>;
}

export interface IAudioDoc extends IAudio, IDocumentId {}

export interface IAudioLight {
    uri: string, 
    theme: string, 
    author: string, 
    description: string, 
    keywords: string, 
    date?: string,
    id?: string
}

export default class Audio implements IAudioObject{
    constructor(
        public uri: string, 
        public theme: string, 
        public author: string, 
        public description: string, 
        public keywords: string, 
        public date: Moment, 
        public id: string){
        this.uri = uri ? uri : FILE_LOCATION.AUDIO_FILE_LOCATION;
        this.theme = _.toUpper(theme);
        this.author = _.toUpper(author);
        this.description = description;
        this.keywords = keywords;
        this.date = date ? date : moment.utc().startOf("day");
        this.id = id;
    }

    get getUri(){return this.uri;}
    get getTheme(){return this.theme;}
    get getAuthor(){return this.author;}
    get getDescription(){return this.description;}
    get getKeywords(){return this.keywords;}
    get getDate(){return this.date;}
    get getId(){return this.id;}

    set setUri(uri: string){this.uri = uri;}
    set setTheme(theme: string){this.theme = _.toUpper(theme);}
    set setAuthor(author: string){this.author = _.toUpper(author);}
    set setDescription(description: string){this.description = description;}
    set setKeywords(keywords: string ){this.keywords = keywords;}
    set setDate(date: Moment){this.date = moment.utc(date, DATE_CONFIG.DEFAULT_FORMAT);}
    set setId(id: string){this.id = id;}

    public static toAudio(doc: IAudioDoc): IAudioObject | null {
        if(!doc) return null;
        return new Audio(doc.uri, doc.theme, doc.author, doc.description, doc.keywords, doc.date, doc._id.toString());
    };

    public static toAudios(docs: IAudioDoc[]): IAudioObject[]{
        if(!docs) return [];
        return docs.map(doc => this.toAudio(doc));
    };

    getAudioModelStruct(){
        return new AudioModel<IAudioDoc>({
            uri: this.uri,
            theme: this.theme,
            author: this.author,
            description: this.description,
            keywords: this.keywords,
            date: this.date,
            _id: new Types.ObjectId(this.id)
        });
    }

    getDefaultUpdateObject(){
        return {
            uri: this.uri,
            theme: this.theme,
            author: this.author,
            description: this.description,
            keywords: this.keywords,
            date: this.date
        };
    }

    async saveToDB(): Promise<IAudioObject> {
        try {
            const result = await DB.postToDB<IAudioDoc>(this.getAudioModelStruct());
            return Promise.resolve(Audio.toAudio(result.data));
        } catch (saveError) {
            return Promise.reject({
                success: false,
                reason: "Couldn't save the audio to the database",
                message: "Une erreur s'est produite lors de l'enregistrement des informations.",
                details: saveError,
                httpCode: HTTP_CODE.INTERNAL_SERVER_ERROR
            });
        }
    }

    async updateToDB(): Promise<IUpdateOne> {
        try {
            const result = await DB.updateOne<IAudioDoc>(AudioModel, this.id, this.getDefaultUpdateObject());
            return Promise.resolve(result);
        } catch (updateError) {
            return Promise.reject({
                success: false,
                reason: "Couldn't aupdate the audio from the database",
                message: "Une erreur s'est produite lors de la mise à jour des informations.",
                details: updateError,
                httpCode: HTTP_CODE.INTERNAL_SERVER_ERROR
            });
        }
    }

    async deleteFromDB(): Promise<DeleteResult> {
        try {
            const result = await DB.deleteFromDB<IAudioDoc>(AudioModel, this.id);
            return Promise.resolve(result);
        } catch (deleteError) {
            return Promise.reject({
                success: false,
                reason: "Couldn't delete the audio from the database",
                message: "Une erreur s'est produite lors de la suppression des informations.",
                details: deleteError,
                httpCode: HTTP_CODE.INTERNAL_SERVER_ERROR
            });
        }
    }

    static async deleteFromDB(id: string): Promise<DeleteResult>{
        try {
            const result = await DB.deleteFromDB<IAudioDoc>(AudioModel, id);
            return Promise.resolve(result);
        } catch (deleteError) {
            return Promise.reject({
                success: false, 
                reason: "Couldn't delete the audio from the database",
                message: "Une erreur s'est produite lors de la suppression des informations.",
                details: deleteError,
                httpCode: HTTP_CODE.INTERNAL_SERVER_ERROR
            });
        }
    }

    static async findOneAudioFromDBById(id: string): Promise<IAudioObject> {
        try {
            const data = await DB.findOne<IAudioDoc>(AudioModel, {_id: id});
            const audio = _.isEmpty(data) ? null : data;
            return Promise.resolve(Audio.toAudio(audio));
        } catch (deleteError) {
            return Promise.reject({
                success: false,
                reason: "Couldn't find the audio from the database",
                message: "Une erreur s'est produite lors de la récupération des informations.",
                details: deleteError,
                httpCode: HTTP_CODE.INTERNAL_SERVER_ERROR
            });
        }
    }

    static async findOneAudioFromDBByUri(uri: string): Promise<IAudioObject> {
        try {
            let data = await DB.findOne<IAudioDoc>(AudioModel, {uri: uri});
            let audio = _.isEmpty(data) ? null : data;
            return Promise.resolve(Audio.toAudio(audio));
        } catch (deleteError) {
            return Promise.reject({
                success: false, 
                reason: "Couldn't find the audio from the database",
                message: "Une erreur s'est produite lors de la récupération des informations.",
                details: deleteError,
                httpCode: HTTP_CODE.INTERNAL_SERVER_ERROR
            });
        }
    }

    static async findAudiosFromDB(
        theme: string, 
        author: string, 
        keywords: string, 
        minDate: Moment, 
        maxDate: Moment, 
        skipNumber: number, 
        limitNumber: number): Promise<IAudioObject[]> {
        try {
            let queryStruct = {};
            let sort = {};

            if(theme){
                _.assign(queryStruct, {theme: theme});
            }

            if(author){
                _.assign(queryStruct, {author: author});
            }

            if(keywords){
                _.assign(
                    queryStruct, 
                    { 
                        $text: { 
                            $search: keywords,
                            $caseSensitive: false,
                            $language: "fr"
                        }
                    });
                _.assign(sort, { score: { $meta: "textScore" }});
            }

            let dateFilter = {};
            if(minDate){
                _.assign(dateFilter, { $gte: moment.utc(minDate, DATE_CONFIG.DEFAULT_FORMAT) });
            }
            if(maxDate){
                _.assign(dateFilter, { $lte: moment.utc(maxDate, DATE_CONFIG.DEFAULT_FORMAT) });
            }

            if(!_.isEmpty(dateFilter)){
                _.assign(queryStruct, { date: dateFilter });
            }

            _.assign(sort, {date: -1, _id: 1});
            let data = await DB.findMany<IAudioDoc>(AudioModel, queryStruct, null, sort, skipNumber, limitNumber);
            if(_.isEmpty(data)){
                data = null
            }
            return Promise.resolve(Audio.toAudios(data));
        } catch (error) {
            return Promise.reject({
                success: false,
                reason: "Couldn't find any audio from the database",
                message: "Une erreur s'est produite lors de la récupération des informations.",
                details: error,
                httpCode: HTTP_CODE.INTERNAL_SERVER_ERROR
            });
        }
    }

    static async getDistinctThemes(): Promise<string[]>{
        try {
            const themes = (await DB.getDistinctValuesForField<IAudioDoc>(AudioModel, 'theme')) as string[];
            return Promise.resolve(Audio.transformAndMakeDistinct(themes));
        } catch (deleteError) {
            return Promise.reject({
                success: false,
                reason: "Couldn't find the themes from the database",
                message: "Une erreur s'est produite lors de la récupération des informations.",
                details: deleteError,
                httpCode: HTTP_CODE.INTERNAL_SERVER_ERROR
            });
        }
    }

    static async getDistinctAuthors(): Promise<string[]>{
        try {
            const authors = (await DB.getDistinctValuesForField<IAudioDoc>(AudioModel, 'author')) as string[];
            return Promise.resolve(Audio.transformAndMakeDistinct(authors));
        } catch (deleteError) {
            return Promise.reject({
                success: false,
                reason: "Couldn't find the authors from the database",
                message: "Une erreur s'est produite lors de la récupération des informations.",
                details: deleteError,
                httpCode: HTTP_CODE.INTERNAL_SERVER_ERROR
            });
        }
    }

    static transformAndMakeDistinct(values: string[]): string[]{
        return _.sortBy(
                    _.uniq(
                        values?.map(value => _.trim(value))
                            .filter(value => !_.isEmpty(value))));
    }
}