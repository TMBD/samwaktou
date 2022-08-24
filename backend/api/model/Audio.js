let _ = require("lodash");
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
        this.keywords = lowerCaseArray(keywords);
        this.date = date;
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
    setKeywords(keywords){this.keywords = lowerCaseArray(keywords);}
    setDate(date){this.date = date;}
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

    // static async findAudiosFromDBByKeywordsMatchAll(keywords, skipNumber, limitNumber){
    //     try {
    //         let data = await DB.findMany(audioModel, {keywords: { $all: keywords }}, null, skipNumber, limitNumber);
    //         if(_.isEmpty(data)){
    //             return Promise.resolve({
    //                 success: true, 
    //                 audios: null
    //             });
    //         }
    //         return Promise.resolve({
    //             success: true, 
    //             audios: data
    //         });
    //     } catch (deleteError) {
    //         return Promise.resolve({
    //             success: false, 
    //             message: deleteError,
    //             details: "Couldn't find any audio from the database"
    //         });
    //     }
    // }

    // static async findAudiosFromDB(skipNumber, limitNumber){
    //     try {
    //         let data = await DB.findLatestRecords(audioModel, null, null, skipNumber, limitNumber);
    //         if(_.isEmpty(data)){
    //             return Promise.resolve({
    //                 success: true, 
    //                 audios: null
    //             });
    //         }
    //         return Promise.resolve({
    //             success: true, 
    //             audios: data
    //         });
    //     } catch (deleteError) {
    //         return Promise.resolve({
    //             success: false, 
    //             message: deleteError,
    //             details: "Couldn't find any audio from the database"
    //         });
    //     }
    // }

    // static async findAudiosFromDBByKeywordsMatchAny(keywords, skipNumber, limitNumber){
    //     try {
    //         var queryStruct = [];
    //         keywords.forEach(element => {
    //             queryStruct.push({
    //                 keywords: element
    //             })
    //         });
    //         let data = await DB.findMany(audioModel, {$or: queryStruct}, null, skipNumber, limitNumber);
    //         if(_.isEmpty(data)){
    //             return Promise.resolve({
    //                 success: true, 
    //                 audios: null
    //             });
    //         }
    //         return Promise.resolve({
    //             success: true, 
    //             audios: data
    //         });
    //     } catch (deleteError) {
    //         return Promise.resolve({
    //             success: false, 
    //             message: deleteError,
    //             details: "Couldn't find any audio from the database"
    //         });
    //     }
    // }


///////////////////////

    static async findAudiosFromDB(theme, author, keywordsParams, dateParams , skipNumber, limitNumber){
        try {
            var queryStruct = {};

            if(theme){
                _.assign(queryStruct, {theme: _.toUpper(theme)});
            }

            if(author){
                _.assign(queryStruct, {author: _.toUpper(author)});
            }

            if(keywordsParams){
                var keywordsQueryStruct;
                if(keywordsParams.matchAll){
                    keywordsQueryStruct = {keywords: { $all: lowerCaseArray(keywordsParams.keywords) }};
                    _.assign(queryStruct, keywordsQueryStruct);
                }else{
                    var keywordsQueryStruct = [];
                    keywordsParams.keywords.forEach(element => {
                        keywordsQueryStruct.push({
                            keywords: _.toLower(element)
                        })
                    });
                    _.assign(queryStruct, {$or: keywordsQueryStruct});
                }
                
            }

            if(dateParams){
                if(dateParams.gte === true){
                    _.assign(queryStruct, {date: { $gte: dateParams.date }});
                }else if(dateParams.gte === false){
                    _.assign(queryStruct, {date: { $lte: dateParams.date }});
                }else{
                    _.assign(queryStruct, {date: dateParams.date});
                }
            }

            let data = await DB.findMany(audioModel, queryStruct, null, skipNumber, limitNumber);
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