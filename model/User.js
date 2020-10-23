let _ = require("lodash");
let userModel = require("./schema/user");
let DB = require("../model/db_crud");


class User{
    constructor(username, tel, email, interestKeywords, date, id){
        this.username = username;
        this.tel = tel;
        this.email = email;
        this.interestKeywords = interestKeywords;
        this.date = date;
        this.id = id;
    }

    getUsername(){return this.username;}
    getTel(){return this.tel;}
    getEmail(){return this.email;}
    getInterestKeywords(){return this.interestKeywords;}
    getDate(){return this.date;}
    getId(){return this.id;}
    

    setUsername(username){this.username = username;}
    setTel(tel){this.tel = tel;}
    setEmail(email){this.email = email;}
    setInterestKeywords(interestKeywords){this.interestKeywords = interestKeywords;}
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
            let data = await DB.findOne(userModel, {username: username});
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

    static async getUsers(skipNumber, limitNumber){
        try {
            let data = await DB.findMany(userModel, null, "_id username interestKeywords email tel date", skipNumber, limitNumber);
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
        } catch (deleteError) {
            return Promise.resolve({
                success: false, 
                message: deleteError,
                details: "Couldn't find any user from the database"
            });
        }
    }
}

module.exports = User;