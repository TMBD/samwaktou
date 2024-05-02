import _ from 'lodash';

import adminModel from './schema/admin.schema';
import DB from './db-crud';
import {HTTP_CODE} from '../config/server.config';
import { Moment } from 'moment';


export default class Admin{
    constructor(
        private surname: string, 
        private name: string, 
        private email: string, 
        private password: string, 
        private date: Moment, 
        private id: string, 
        private isSuperAdmin: boolean){
        this.surname = _.capitalize(surname);
        this.name = _.toUpper(name);
        this.email = _.toLower(email);
        this.date = date;
        this.id = id;
        this.password = password;
        this.isSuperAdmin = isSuperAdmin;
    }

    getSurname(){return this.surname;}
    getName(){return this.name;}
    getEmail(){return this.email;}
    getPassword(){return this.password;}
    getDate(){return this.date;}
    getId(){return this.id;}
    getIsSuperAdmin(){return this.isSuperAdmin;}
    

    setSurname(surname){this.surname = _.capitalize(surname);}
    setName(name){this.name = _.toUpper(name);}
    setEmail(email){this.email = _.toLower(email);}
    setPassword(password){this.password = password;}
    setDate(date){this.date = date;}
    setId(id){this.id = id;}
    setIsSuperAdmin(isSuperAdmin){this.isSuperAdmin = isSuperAdmin;}


    getAdminModelStruct(){
        return new adminModel({
            surname: this.surname,
            name: this.name,
            email: this.email,
            password: this.password,
            date: this.date,
            isSuperAdmin: this.isSuperAdmin
        });
    }

    getStruct(){
        return {
            surname: this.surname,
            name: this.name,
            email: this.email,
            password: this.password,
            date: this.date,
            isSuperAdmin: this.isSuperAdmin

        };
    }

    async saveToDB(){
        try {
            let result = await DB.postToDB(this.getAdminModelStruct());
            this.setId(result.data._id);
            this.setDate(result.data.date);
            return Promise.resolve(result);
        } catch (saveError) {
            return Promise.reject({
                success: false,
                reason: "Couldn't save admin from the database",
                message: "Une erreur s'est produite lors de l'enregistrement des informations.",
                details: saveError,
                httpCode: HTTP_CODE.INTERNAL_SERVER_ERROR
            });
        }
    }

    async updateToDB(){
        try {
            let result = await DB.updateOne(adminModel, this.getId(), this.getStruct());
            return Promise.resolve({
                success: true, 
                data: result
            });
        } catch (updateError) {
            return Promise.reject({
                success: false,
                reason: "Couldn't aupdate admin from the database",
                message: "Une erreur s'est produite lors de la mise à jour des informations.",
                details: updateError,
                httpCode: HTTP_CODE.INTERNAL_SERVER_ERROR
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
            return Promise.reject({
                success: false,
                reason: "Couldn't delete admin from the database",
                message: "Une erreur s'est produite lors de la suppression des informations.",
                details: deleteError,
                httpCode: HTTP_CODE.INTERNAL_SERVER_ERROR
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
            return Promise.reject({
                success: false,
                reason: "Couldn't delete admin from the database",
                message: "Une erreur s'est produite lors de la suppression des informations.",
                details: deleteError,
                httpCode: HTTP_CODE.INTERNAL_SERVER_ERROR
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
            return Promise.reject({
                success: false,
                reason: "Couldn't find admin from the database",
                message: "Une erreur s'est produite lors de la récupération des informations.",
                details: deleteError,
                httpCode: HTTP_CODE.INTERNAL_SERVER_ERROR
            });
        }
    }

    static async findOneAdminFromDBByEmail(email){
        try {
            let data = Admin.getRootAdmin(email);
            
            if(data === null) data = await DB.findOne(adminModel, {email: email});
            let admin = _.isEmpty(data) ? null : data;
            return Promise.resolve({
                success: true, 
                admin: admin
            });
        } catch (deleteError) {
            return Promise.reject({
                success: false, 
                reason: "Couldn't find any admin from the database !",
                message: "Une erreur s'est produite lors de la récupération des informations.",
                details: deleteError,
                httpCode: HTTP_CODE.INTERNAL_SERVER_ERROR
            });
        }
    }

    static async getAdmins(surname, name, email, dateParams, isSuperAdmin, skipNumber, limitNumber){
        try {


            var queryStruct = {};

            if(surname){
                _.assign(queryStruct, {surname: _.capitalize(surname)});
            }

            if(name){
                _.assign(queryStruct, {name: _.toUpper(name)});
            }

            if(email){
                _.assign(queryStruct, {email: _.toLower(email)});
            }

            if(!(isSuperAdmin === undefined)){
                _.assign(queryStruct, {isSuperAdmin: isSuperAdmin});
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

            let data = await DB.findMany(adminModel, queryStruct, "_id surname name email date isSuperAdmin", null, skipNumber, limitNumber);
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
            return Promise.reject({
                success: false,
                reason: "Couldn't find admins from the database",
                message: "Une erreur s'est produite lors de la récupération des informations.",
                details: deleteError,
                httpCode: HTTP_CODE.INTERNAL_SERVER_ERROR
            });
        }
    }

    static getRootAdmin(email){
        if(email == process.env.ROOT_ADMIN_EMAIL){
            return {
                "_id": process.env.ROOT_ADMIN_ID,
                "surname": process.env.ROOT_ADMIN_SURNAME,
                "name": process.env.ROOT_ADMIN_NAME,
                "email": process.env.ROOT_ADMIN_EMAIL,
                "date": process.env.ROOT_ADMIN_DATE,
                "password": process.env.ROOT_ADMIN_PASSWORD,
                "isSuperAdmin": true
            }
        }
        return null;
    }
}