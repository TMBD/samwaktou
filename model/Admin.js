let _ = require("lodash");
let adminModel = require("./schema/admin");
let DB = require("../model/db_crud");
const CONFIG = require("../config/server_config");


class Admin{
    constructor(surname, name, email, password, date, id){
        this.surname = surname;
        this.name = name;
        this.email = email;
        this.date = date;
        this.id = id;
        this.password = password;
    }

    getSurname(){return this.surname;}
    getName(){return this.name;}
    getEmail(){return this.email;}
    getId(){return this.password;}
    getDate(){return this.date;}
    getId(){return this.id;}
    

    setSurname(surname){this.surname = surname;}
    setName(name){this.name = name;}
    setEmail(email){this.email = email;}
    setEmail(password){this.password = password;}
    setDate(date){this.date = date;}
    setId(id){this.id = id;}


    getAdminModelStruct(){
        return new adminModel({
            surname: this.surname,
            name: this.name,
            email: this.email,
            password: this.password,
            date: this.date
        });
    }

    getStruct(){
        return {
            surname: this.surname,
            name: this.name,
            email: this.email,
            password: this.password,
            date: this.date
        };
    }

    async saveToDB(){
        try {
            let result = await DB.postToDB(this.getAdminModelStruct());
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
            let result = await DB.updateOne(adminModel, this.getId(), this.getStruct());
            return Promise.resolve({
                success: true, 
                data: result
            });
        } catch (updateError) {
            return Promise.resolve({
                success: false, 
                message: updateError,
                details: "Couldn't aupdate admin from the database"
            });
        }
    }

    async deleteFromDB(){
        try {
            let result = await DB.deleteFromDB(adminModel, this.getId());
            return Promise.resolve({
                success: true, 
                data: result
            });
        } catch (deleteError) {
            return Promise.resolve({
                success: false, 
                message: deleteError,
                details: "Couldn't delete admin from the database"
            });
        }
    }

    static async deleteFromDB(id){
        try {
            let result = await DB.deleteFromDB(adminModel, id);
            return Promise.resolve({
                success: true, 
                data: result
            });
        } catch (deleteError) {
            return Promise.resolve({
                success: false, 
                message: deleteError,
                details: "Couldn't delete Audio from the database"
            });
        }
    }

    static async findOneAdminFromDBById(id){
        try {
            let data = await DB.findOne(adminModel, {_id: id});
            let admin = _.isEmpty(data) ? null : data;
            return Promise.resolve({
                success: true, 
                admin: admin
            });
        } catch (deleteError) {
            return Promise.resolve({
                success: false, 
                message: deleteError,
                details: "Couldn't find admin from the database"
            });
        }
    }

    static async findOneAdminFromDBByEmail(email){
        try {
            let data = await DB.findOne(adminModel, {email: email});
            let admin = _.isEmpty(data) ? null : data;
            return Promise.resolve({
                success: true, 
                admin: admin
            });
        } catch (deleteError) {
            return Promise.resolve({
                success: false, 
                message: deleteError,
                details: "Couldn't find admin from the database"
            });
        }
    }

    static async getAdmins(skipNumber, limitNumber){
        try {
            let data = await DB.findMany(adminModel, null, null, skipNumber, limitNumber);
            if(_.isEmpty(data)){
                return Promise.resolve({
                    success: true, 
                    admins: null
                });
            }
            return Promise.resolve({
                success: true, 
                admins: data
            });
        } catch (deleteError) {
            return Promise.resolve({
                success: false, 
                message: deleteError,
                details: "Couldn't find admins from the database"
            });
        }
    }
}

module.exports = Admin;