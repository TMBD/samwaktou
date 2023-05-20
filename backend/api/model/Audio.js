let _ = require("lodash");
let moment = require("moment");
let audioModel = require("./schema/audio");
let DB = require("../model/db_crud");
const CONFIG = require("../config/server_config");
let {lowerCaseArray} = require("./../controler/utils/common")


class Audio{
    constructor(uri, title, theme, author, description, keywords, date, id){
        this.uri = uri ? uri : CONFIG.FILE_LOCATION.AUDIO_FILE_LOCATION;
        this.title = _.capitalize(title);
        this.theme = _.toUpper(theme),
        this.author = _.toUpper(author),
        this.description = _.capitalize(description);
        this.keywords = _.toLower(keywords);
        this.date = date ? moment.utc(date, "YYYY-MM-DD") : moment.utc().startOf("day");
        this.id = id;
    }

    getUri(){return this.uri;}
    getTitle(){return this.title;}
    getTheme(){return this.theme;}
    getAuthor(){return this.author;}
    getDescription(){return this.description;}
    getKeywords(){return this.keywords;}
    getDate(){return this.date;}
    getId(){return this.id;}

    setUri(uri){this.uri = uri;}
    setTitle(title){this.title = _.capitalize(title);}
    setTheme(theme){this.theme = _.toUpper(theme);}
    setAuthor(author){this.author = _.toUpper(author);}
    setDescription(description){this.description = _.capitalize(description);}
    setKeywords(keywords){this.keywords = _.toLower(keywords);}
    setDate(date){this.date = moment.utc(date, "YYYY-MM-DD");}
    setId(id){this.id = id;}


    getAudioModelStruct(){
        return new audioModel({
            uri: this.uri,
            title: this.title,
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
            title: this.title,
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
            return Promise.resolve(saveError);
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

    static async findAudiosFromDB(theme, author, keywords, minDate , maxDate, skipNumber, limitNumber){
        try {
            let queryStruct = {};
            let sort = {date: -1};

            if(theme){
                _.assign(queryStruct, {theme: _.toUpper(theme)});
            }

            if(author){
                _.assign(queryStruct, {author: _.toUpper(author)});
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
                _.assign(dateFilter, { $gte: moment.utc(minDate, "YYYY-MM-DD") });
            }
            if(maxDate){
                _.assign(dateFilter, { $lte: moment.utc(maxDate, "YYYY-MM-DD") });
            }

            if(!_.isEmpty(dateFilter)){
                _.assign(queryStruct, { date: dateFilter });
            }

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
            return Promise.resolve({
                success: false, 
                message: error,
                details: "Couldn't find any audio from the database"
            });
        }
    }
}

module.exports = Audio;