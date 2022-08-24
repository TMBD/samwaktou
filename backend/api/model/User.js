let _ = require("lodash");
let userModel = require("./schema/user");
let DB = require("../model/db_crud");
let {lowerCaseArray} = require("./../controler/utils/common");


class User{
    constructor(username, tel, email, interestKeywords, date, id){
        this.username = _.toLower(username);
        this.tel = tel;
        this.email = _.toLower(email);
        this.interestKeywords = lowerCaseArray(interestKeywords);
        this.date = date;
        this.id = id;
    }

    getUsername(){return this.username;}
    getTel(){return this.tel;}
    getEmail(){return this.email;}
    getInterestKeywords(){return this.interestKeywords;}
    getDate(){return this.date;}
    getId(){return this.id;}
    

    setUsername(username){this.username = _.toLower(username);}
    setTel(tel){this.tel = tel;}
    setEmail(email){this.email = _.toLower(email);}
    setInterestKeywords(interestKeywords){this.interestKeywords = lowerCaseArray(interestKeywords);}
    setDate(date){this.date = date;}
    setId(id){this.id = id;}


    getUserModelStruct(){
        return new userModel({
            username: this.username,
            tel: this.tel,
            email: this.email,
            interestKeywords: this.interestKeywords,
            date: this.date
        });
    }

    getStruct(){
        return {
            username: this.username,
            tel: this.tel,
            email: this.email,
            interestKeywords: this.interestKeywords,
            date: this.date
        };
    }

    async saveToDB(){
        try {
            let result = await DB.postToDB(this.getUserModelStruct());
            this.setId(result.data._id);
            this.setDate(result.data.date);
            return Promise.resolve(result);
        } catch (saveError) {
            return Promise.resolve(saveError);
        }
    }

    async updateToDB(){
        try {
            let result = await DB.updateOne(userModel, this.getId(), this.getStruct());
            return Promise.resolve({
                success: true, 
                data: result
            });
        } catch (updateError) {
            return Promise.resolve({
                success: false, 
                message: updateError,
                details: "Couldn't aupdate user from the database"
            });
        }
    }


    async deleteFromDB(){
        try {
            let result = await DB.deleteFromDB(userModel, this.getId());
            return Promise.resolve({
                success: true, 
                data: result
            });
        } catch (deleteError) {
            return Promise.resolve({
                success: false, 
                message: deleteError,
                details: "Couldn't delete user from the database"
            });
        }
    }

    static async deleteFromDB(id){
        try {
            let result = await DB.deleteFromDB(userModel, id);
            return Promise.resolve({
                success: true, 
                data: result
            });
        } catch (deleteError) {
            return Promise.resolve({
                success: false, 
                message: deleteError,
                details: "Couldn't delete user from the database"
            });
        }
    }

    static async findOneUserFromDBById(id){
        try {
            let data = await DB.findOne(userModel, {_id: id});
            let user = _.isEmpty(data) ? null : data;
            return Promise.resolve({
                success: true, 
                user: user
            });
        } catch (deleteError) {
            return Promise.resolve({
                success: false, 
                message: deleteError,
                details: "Couldn't find user from the database"
            });
        }
    }

    static async findOneUserFromDBByUsername(username){
        try {
            let data = await DB.findOne(userModel, {username: _.toLower(username)});
            let user = _.isEmpty(data) ? null : data;
            return Promise.resolve({
                success: true, 
                user: user
            });
        } catch (deleteError) {
            return Promise.resolve({
                success: false, 
                message: deleteError,
                details: "Couldn't find any user from the database !"
            });
        }
    }

    static async getUsers(username, tel, email, interestParams, dateParams, skipNumber, limitNumber){
        try {

            var queryStruct = {};

            if(username){
                _.assign(queryStruct, {username: _.toLower(username)});
            }

            if(tel){
                _.assign(queryStruct, {tel: tel});
            }

            if(email){
                _.assign(queryStruct, {email: _.toLower(email)});
            }
            
            if(interestParams){
                if(interestParams.matchAll){
                    var keywordsQueryStruct;
                    keywordsQueryStruct = {interestKeywords: { $all: lowerCaseArray(interestParams.keywords) }};
                    _.assign(queryStruct, keywordsQueryStruct);
                }else{
                    var keywordsQueryStruct = [];
                    interestParams.keywords.forEach(element => {
                        
                        keywordsQueryStruct.push({
                            interestKeywords: element
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

            let data = await DB.findMany(userModel, queryStruct, "_id username interestKeywords email tel date", skipNumber, limitNumber);
            if(_.isEmpty(data)){
                return Promise.resolve({
                    success: true, 
                    users: null
                });
            }
            return Promise.resolve({
                success: true, 
                users: data
            });
        } catch (getUserError) {
            return Promise.resolve({
                success: false, 
                message: getUserError,
                details: "Couldn't find any user from the database"
            });
        }
    }
}

module.exports = User;