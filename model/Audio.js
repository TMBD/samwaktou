let audioModel = require("./schema/audio");
let DB = require("../model/db_crud");
const CONFIG = require("../config/server_config");

class Audio{
    constructor(uri, description, keywords, date){
        this.uri = uri ? uri : CONFIG.FILE_LOCATION.AUDIO_FILE_LOCATION;
        this.description = description;
        this.keywords = keywords;
        this.date = date;
        this.id = null;
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
        let result = await DB.postToDB(this.getAudioModelStruct());
        this.setId(result.data._id);
        this.setDate(result.data.date);
        return Promise.resolve(result);
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
                details: "Couldn't aupdate Audio from database"
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
                details: "Couldn't delete Audio from database"
            });
        }
    }
}

module.exports = Audio;