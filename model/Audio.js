let _ = require("lodash");
let audioModel = require("./schema/audio");
let DB = require("../model/db_crud");
const CONFIG = require("../config/server_config");


class Audio{
    constructor(uri, description, keywords, date, id){
        this.uri = uri ? uri : CONFIG.FILE_LOCATION.AUDIO_FILE_LOCATION;
        this.description = description;
        this.keywords = keywords;
        this.date = date;
        this.id = id;
    }

    getUri(){return this.uri;}
    getDescription(){return this.description;}
    getKeywords(){return this.keywords;}
    getDate(){return this.date;}
    getId(){return this.id;}

    setUri(uri){this.uri = uri;}
    setDescription(description){this.description = description;}
    setKeywords(keywords){this.keywords = keywords;}
    setDate(date){this.date = date;}
    setId(id){this.id = id;}


    getAudioModelStruct(){
        return new audioModel({
            uri: this.uri,
            description: this.description,
            keywords: this.keywords,
            date: this.date
        });
    }

    getStruct(){
        return {
            uri: this.uri,
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
            return Promise.resolve(saveError);
        }
    }

    async updateToDB(){
        try {
            //let result = await DB.updateOne(this.getAudioModelStruct(), this.getId(), this.getAudioModelStruct());
            let result = await DB.updateOne(audioModel, this.getId(), this.getStruct());
            return Promise.resolve({
                success: true, 
                data: result
            });
        } catch (updateError) {
            return Promise.resolve({
                success: false, 
                message: updateError,
                details: "Couldn't aupdate the audio from the database"
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
            return Promise.resolve({
                success: false, 
                message: deleteError,
                details: "Couldn't delete the audio from the database"
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
            return Promise.resolve({
                success: false, 
                message: deleteError,
                details: "Couldn't delete the audio from the database"
            });
        }
    }

    static async findOneAudioFromDBById(id){
        try {
            let data = await DB.findOne(audioModel, {_id: id});
            //let audio = _.isEmpty(data) ? null : new Audio(data.uri, data.description, data.keywords, data.date, data._id);
            let audio = _.isEmpty(data) ? null : data;
            return Promise.resolve({
                success: true, 
                audio: audio
            });
        } catch (deleteError) {
            return Promise.resolve({
                success: false, 
                message: deleteError,
                details: "Couldn't find the audio from the database"
            });
        }
    }

    static async findOneAudioFromDBByUri(uri){
        try {
            let data = await DB.findOne(audioModel, {uri: uri});
            //let audio = _.isEmpty(data) ? null : new Audio(data.uri, data.description, data.keywords, data.date, data._id);
            let audio = _.isEmpty(data) ? null : data;
            return Promise.resolve({
                success: true, 
                audio: audio
            });
        } catch (deleteError) {
            return Promise.resolve({
                success: false, 
                message: deleteError,
                details: "Couldn't find the audio from the database"
            });
        }
    }

    static async findAudiosFromDBByKeywordsMatchAll(keywords, skipNumber, limitNumber){
        try {
            let data = await DB.findMany(audioModel, {keywords: { $all: keywords }}, null, skipNumber, limitNumber);
            if(_.isEmpty(data)){
                return Promise.resolve({
                    success: true, 
                    audios: null
                });
            }
            // var audioList = [];
            // data.forEach(element => {
            //     audioList.push(new Audio(element.uri, element.description, element.keywords, element.date. element._id));
            // });
            return Promise.resolve({
                success: true, 
                audios: data
            });
        } catch (deleteError) {
            return Promise.resolve({
                success: false, 
                message: deleteError,
                details: "Couldn't find any audio from the database"
            });
        }
    }

    static async findAudiosFromDBByKeywordsMatchAny(keywords, skipNumber, limitNumber){
        try {
            var queryStruct = [];
            keywords.forEach(element => {
                queryStruct.push({
                    keywords: element
                })
            });
            //let data = await DB.findMany(audioModel, {keywords: keywords}, null, skipNumber, limitNumber);
            let data = await DB.findMany(audioModel, {$or: queryStruct}, null, skipNumber, limitNumber);
            if(_.isEmpty(data)){
                return Promise.resolve({
                    success: true, 
                    audios: null
                });
            }
            // var audioList = [];
            // data.forEach(element => {
            //     audioList.push(new Audio(element.uri, element.description, element.keywords, element.date. element._id));
            // });
            return Promise.resolve({
                success: true, 
                audios: data
            });
        } catch (deleteError) {
            return Promise.resolve({
                success: false, 
                message: deleteError,
                details: "Couldn't find any audio from the database"
            });
        }
    }
}

module.exports = Audio;