import { Moment } from 'moment';
import _ from 'lodash';

import userModel from './schema/user.schema';
import DB from './db-crud';
import { HTTP_CODE } from '../config/server.config';


export default class User{
    constructor(
        private username: string, 
        private tel: string, 
        private email: string, 
        private date: Moment, 
        private id: string){
        this.username = _.toLower(username);
        this.tel = tel;
        this.email = _.toLower(email);
        this.date = date;
        this.id = id;
    }

    getUsername(){return this.username;}
    getTel(){return this.tel;}
    getEmail(){return this.email;}
    getDate(){return this.date;}
    getId(){return this.id;}
    

    setUsername(username){this.username = _.toLower(username);}
    setTel(tel){this.tel = tel;}
    setEmail(email){this.email = _.toLower(email);}
    setDate(date){this.date = date;}
    setId(id){this.id = id;}


    getUserModelStruct(){
        return new userModel({
            username: this.username,
            tel: this.tel,
            email: this.email,
            date: this.date
        });
    }

    getStruct(){
        return {
            username: this.username,
            tel: this.tel,
            email: this.email,
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
            return Promise.reject({
                success: false,
                reason: "Couldn't save the user from the database",
                message: "Une erreur s'est produite lors de l'enregistrement des informations.",
                details: saveError,
                httpCode: HTTP_CODE.INTERNAL_SERVER_ERROR
            });
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
            return Promise.reject({
                success: false,
                reason: "Couldn't aupdate user from the database",
                message: "Une erreur s'est produite lors de la mise à jour des informations.",
                details: updateError,
                httpCode: HTTP_CODE.INTERNAL_SERVER_ERROR
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
            return Promise.reject({
                success: false,
                reason: "Couldn't delete user from the database",
                message: "Une erreur s'est produite lors de la suppression des informations.",
                details: deleteError,
                httpCode: HTTP_CODE.INTERNAL_SERVER_ERROR
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
            return Promise.reject({
                success: false,
                reason: "Couldn't delete user from the database",
                message: "Une erreur s'est produite lors de la suppression des informations.",
                details: deleteError,
                httpCode: HTTP_CODE.INTERNAL_SERVER_ERROR
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
            return Promise.reject({
                success: false,
                reason: "Couldn't find user from the database",
                message: "Une erreur s'est produite lors de la récupération des informations.",
                details: deleteError,
                httpCode: HTTP_CODE.INTERNAL_SERVER_ERROR
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
            return Promise.reject({
                success: false,
                reason: "Couldn't find any user from the database !",
                message: "Une erreur s'est produite lors de la récupération des informations.",
                details: deleteError,
                httpCode: HTTP_CODE.INTERNAL_SERVER_ERROR
            });
        }
    }

    static async getUsers(username, tel, email, dateParams, skipNumber, limitNumber){
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
            
            if(dateParams){
                if(dateParams.gte === true){
                    _.assign(queryStruct, {date: { $gte: dateParams.date }});
                }else if(dateParams.gte === false){
                    _.assign(queryStruct, {date: { $lte: dateParams.date }});
                }else{
                    _.assign(queryStruct, {date: dateParams.date});
                }
            }

            let data = await DB.findMany(userModel, queryStruct, null, null, skipNumber, limitNumber);
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
            return Promise.reject({
                success: false,
                reason: "Couldn't find any user from the database",
                message: "Une erreur s'est produite lors de la récupération des informations.",
                details: getUserError,
                httpCode: HTTP_CODE.INTERNAL_SERVER_ERROR
            });
        }
    }
}