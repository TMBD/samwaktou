import _ from 'lodash';
import moment, { Moment } from 'moment';

import audioModel from './schema/audio.schema';
import DB from './db-crud';
import { HTTP_CODE, FILE_LOCATION, DATE_CONFIG } from '../config/server.config';


export default class Audio{
    constructor(
        private uri: string, 
        private theme: string, 
        private author: string, 
        private description: string, 
        private keywords: string, 
        private date: Moment, 
        private id: string){
        this.uri = uri ? uri : FILE_LOCATION.AUDIO_FILE_LOCATION;
        this.theme = _.toUpper(theme),
        this.author = _.toUpper(author),
        this.description = description;
        this.keywords = keywords;
        this.date = date ? moment.utc(date, DATE_CONFIG.DEFAULT_FORMAT) : moment.utc().startOf("day");
        this.id = id;
    }

    getUri(){return this.uri;}
    getTheme(){return this.theme;}
    getAuthor(){return this.author;}
    getDescription(){return this.description;}
    getKeywords(){return this.keywords;}
    getDate(){return this.date;}
    getId(){return this.id;}

    setUri(uri){this.uri = uri;}
    setTheme(theme){this.theme = _.toUpper(theme);}
    setAuthor(author){this.author = _.toUpper(author);}
    setDescription(description){this.description = description;}
    setKeywords(keywords){this.keywords = keywords;}
    setDate(date){this.date = moment.utc(date, DATE_CONFIG.DEFAULT_FORMAT);}
    setId(id){this.id = id;}


    getAudioModelStruct(){
        return new audioModel({
            uri: this.uri,
            theme: this.theme,
            author: this.author,
            description: this.description,
            keywords: this.keywords,
            date: this.date
        });
    }

    getStruct(){
        return {
            uri: this.uri,
            theme: this.theme,
            author: this.author,
            description: this.description,
            keywords: this.keywords,
            date: this.date
        };
    }

    async saveToDB(){
        try {
            let result = await DB.postToDB(this.getAudioModelStruct());
            this.setId(result.data._id);
            this.setDate(result.data.date);
            return Promise.resolve(result);
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

    async updateToDB(){
        try {
            let result = await DB.updateOne(audioModel, this.getId(), this.getStruct());
            return Promise.resolve({
                success: true, 
                data: result
            });
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

    async deleteFromDB(){
        try {
            let result = await DB.deleteFromDB(audioModel, this.getId());
            return Promise.resolve({
                success: true, 
                data: result
            });
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

    static async deleteFromDB(id){
        try {
            let result = await DB.deleteFromDB(audioModel, id);
            return Promise.resolve({
                success: true, 
                data: result
            });
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

    static async findOneAudioFromDBById(id){
        try {
            let data = await DB.findOne(audioModel, {_id: id});
            let audio = _.isEmpty(data) ? null : data;
            return Promise.resolve({
                success: true, 
                audio: audio
            });
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

    static async findOneAudioFromDBByUri(uri){
        try {
            let data = await DB.findOne(audioModel, {uri: uri});
            let audio = _.isEmpty(data) ? null : data;
            return Promise.resolve({
                success: true, 
                audio: audio
            });
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

    static async findAudiosFromDB(theme, author, keywords, minDate , maxDate, skipNumber, limitNumber){
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
            let data = await DB.findMany(audioModel, queryStruct, null, sort, skipNumber, limitNumber);
            if(_.isEmpty(data)){
                return Promise.resolve({
                    success: true, 
                    audios: null
                });
            }
            return Promise.resolve({
                success: true, 
                audios: data
            });
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

    static async getDistinctThemes(){
        try {
            let themes = await DB.getDistinctValuesForField(audioModel, "theme");
            themes = Audio.transformAndMakeDistinct(themes)
            return Promise.resolve({
                success: true, 
                data: themes
            });
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

    static async getDistinctAuthors(){
        try {
            let authors = await DB.getDistinctValuesForField(audioModel, "author");
            authors = Audio.transformAndMakeDistinct(authors)
            return Promise.resolve({
                success: true, 
                data: authors
            });
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

    static transformAndMakeDistinct(values){
        return _.sortBy(
                    _.uniq(
                        values?.map(value => _.trim(value))
                            .filter(value => !_.isEmpty(value))));
    }
}