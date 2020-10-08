let audioSchema = require("./schema/audio");
let DB = require("../model/db_crud");

class Audio{
    constructor(uri, description, keywords, date){
        this.uri = uri;
        this.description = description;
        this.keywords = keywords;
        this.date = date;
    }

    getUri(){return this.uri;}
    getDescription(){return this.description;}
    getKeywords(){return this.keywords;}
    getDate(){return this.date;}

    setUri(uri){this.uri = uri;}
    setDescription(description){this.description = description;}
    setKeywords(keywords){this.keywords = keywords;}
    setDate(date){this.date = date;}

    getSchema() {
        return new audioSchema({
            uri: this.uri,
            description: this.description,
            keywords: this.keywords,
            date: this.date
        });
    }

    saveToDB(callBack){
        DB.postToDB(getSchema(), callBack);
    }

    updateToDB(){

    }

    deleteFromDB(){

    }
}

module.exports = Audio;