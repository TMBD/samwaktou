import _ from 'lodash';
import moment, { Moment } from 'moment';
import { DeleteResult } from 'mongodb';
import { Types } from 'mongoose';
import { Request } from 'express';

import AdminModel from './schema/admin.schema';
import DB, { IDocumentId, IUpdateOne } from './db-crud';
import {HTTP_CODE} from '../config/server.config';


export interface AuthenticatedAdminRequest<
    P = any,
    ResBody = any,
    ReqBody = any,
    ReqQuery = any> extends Request<P, ResBody, ReqBody, ReqQuery> {
    authData?: {
        isSuperAdmin: boolean;
        id?: string,
        isAdmin?: boolean
    };
}

interface IAdmin {
    surname: string,
    name: string,
    email: string,
    password: string,
    date: Moment,
    isSuperAdmin: boolean
}

export interface IAdminObject extends IAdmin {
    id: string;
    
    saveToDB(): Promise<IAdminObject>;
    updateToDB(): Promise<IUpdateOne>;
    deleteFromDB(): Promise<DeleteResult>;
}

export interface IAdminDoc extends IAdmin, IDocumentId {}

export interface IAdminLight {
    surname: string, 
    name: string, 
    email: string, 
    password: string, 
    date?: Moment, 
    isSuperAdmin?: boolean,
    id?: string
}

export default class Admin implements IAdminObject {
    constructor(
        public surname: string, 
        public name: string, 
        public email: string, 
        public password: string, 
        public date: Moment, 
        public isSuperAdmin: boolean,
        public id: string){
        this.surname = _.capitalize(surname);
        this.name = _.toUpper(name);
        this.email = _.toLower(email);
        this.password = password;
        this.date = date;
        this.isSuperAdmin = isSuperAdmin;
        this.id = id;
    }

    get getSurname(){return this.surname;}
    get getName(){return this.name;}
    get getEmail(){return this.email;}
    get getPassword(){return this.password;}
    get getDate(){return this.date;}
    get getIsSuperAdmin(){return this.isSuperAdmin;}
    get getId(){return this.id;}
    
    set setSurname(surname: string){this.surname = _.capitalize(surname);}
    set setName(name: string){this.name = _.toUpper(name);}
    set setEmail(email: string){this.email = _.toLower(email);}
    set setPassword(password: string){this.password = password;}
    set setDate(date: Moment){this.date = date;}
    set setIsSuperAdmin(isSuperAdmin: boolean){this.isSuperAdmin = isSuperAdmin;}
    set setId(id: string){this.id = id;}

    public static toAdmin(doc: IAdminDoc): IAdminObject{
        if(!doc) return null;
        return new Admin(doc.surname, doc.name, doc.email, doc.password, doc.date, doc.isSuperAdmin, doc._id.toString());
    };

    public static toAdmins(docs: IAdminDoc[]): IAdminObject[]{
        if(!docs) return null;
        return docs.map(doc => this.toAdmin(doc));
    };

    getAdminModelStruct(){
        return new AdminModel<IAdminDoc>({
            surname: this.surname,
            name: this.name,
            email: this.email,
            password: this.password,
            date: this.date,
            isSuperAdmin: this.isSuperAdmin,
            _id: new Types.ObjectId(this.id)
        });
    }

    getDefaultUpdateObject(){
        return {
            surname: this.surname,
            name: this.name,
            email: this.email,
            password: this.password,
            date: this.date,
            isSuperAdmin: this.isSuperAdmin

        };
    }

    async saveToDB(): Promise<IAdminObject> {
        try {
            const result = await DB.postToDB<IAdminDoc>(this.getAdminModelStruct());
            return Promise.resolve(Admin.toAdmin(result.data));
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

    async updateToDB(): Promise<IUpdateOne> {
        try {
            const result = await DB.updateOne<IAdminDoc>(AdminModel, this.id, this.getDefaultUpdateObject());
            return Promise.resolve(result);
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


    async deleteFromDB(): Promise<DeleteResult> {
        try {
            const result = await DB.deleteFromDB<IAdminDoc>(AdminModel, this.id);
            return Promise.resolve(result);
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

    static async deleteFromDB(id: string): Promise<DeleteResult>{
        try {
            const result = await DB.deleteFromDB<IAdminDoc>(AdminModel, id);
            return Promise.resolve(result);
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

    static async findOneAdminFromDBById(id: string): Promise<IAdminObject> {
        try {
            const data = await DB.findOne<IAdminDoc>(AdminModel, {_id: id});
            const audio = _.isEmpty(data) ? null : data;
            return Promise.resolve(Admin.toAdmin(audio));
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

    static async findOneAdminFromDBByEmail(email: string): Promise<IAdminObject>{
        try {
            let data = Admin.getRootAdmin(email);
            
            if(!data) data = await DB.findOne<IAdminDoc>(AdminModel, {email: email});
            const admin = _.isEmpty(data) ? null : data;
            return Promise.resolve(Admin.toAdmin(admin));
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

    static async getAdmins(
        surname: string, 
        name: string, 
        email: string, 
        dateParams: {date: Moment, gte: boolean}, 
        isSuperAdmin: boolean, 
        skipNumber: number, 
        limitNumber: number): Promise<IAdminObject[]> {
        try {
            let queryStruct = {};

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

            const foundAdmins = await DB.findMany<IAdminDoc>(AdminModel, queryStruct, {_id: 1, surname: 1, name: 1, email: 1, date: 1, isSuperAdmin: 1}, null, skipNumber, limitNumber);
            return Promise.resolve(Admin.toAdmins(foundAdmins));
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

    static getRootAdmin(email: string): IAdminDoc{
        if(email == process.env.ROOT_ADMIN_EMAIL){
            return {
                "_id": new Types.ObjectId(process.env.ROOT_ADMIN_ID) ,
                "surname": process.env.ROOT_ADMIN_SURNAME,
                "name": process.env.ROOT_ADMIN_NAME,
                "email": process.env.ROOT_ADMIN_EMAIL,
                "date": moment.utc(process.env.ROOT_ADMIN_DATE),
                "password": process.env.ROOT_ADMIN_PASSWORD,
                "isSuperAdmin": true
            }
        }
        return null;
    }
}