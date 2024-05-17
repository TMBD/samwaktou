import { Moment } from 'moment';
import _ from 'lodash';
import { DeleteResult } from 'mongodb';
import { Types } from 'mongoose';
import { Request } from 'express';

import UserModel from './schema/user.schema';
import DB, { IDocumentId, IUpdateOne } from './db-crud';
import { HTTP_CODE } from '../config/server.config';


export interface AuthenticatedUserRequest<
    P = any,
    ResBody = any,
    ReqBody = any,
    ReqQuery = any> extends Request<P, ResBody, ReqBody, ReqQuery> {
    authData?: {
        username: string;
        id?: string
    };
}


interface IUser {
    username: string, 
    tel: string, 
    email: string, 
    date: Moment, 
}

export interface IUserObject extends IUser {
    id: string;
    
    saveToDB(): Promise<IUserObject>;
    updateToDB(): Promise<IUpdateOne>;
    deleteFromDB(): Promise<DeleteResult>;
}

export interface IUserDoc extends IUser, IDocumentId {}

export interface IUserLight {
    username: string, 
    tel: string, 
    email?: string, 
    date?: Moment, 
    id?: string
}

export default class User implements IUserObject{
    constructor(
        public username: string, 
        public tel: string, 
        public email: string, 
        public date: Moment, 
        public id: string){
        this.username = _.toLower(username);
        this.tel = tel;
        this.email = _.toLower(email);
        this.date = date;
        this.id = id;
    }

    get getUsername(){return this.username;}
    get getTel(){return this.tel;}
    get getEmail(){return this.email;}
    get getDate(){return this.date;}
    get getId(){return this.id;}
    

    set setUsername(username: string){this.username = _.toLower(username);}
    set setTel(tel: string){this.tel = tel;}
    set setEmail(email: string){this.email = _.toLower(email);}
    set setDate(date: Moment){this.date = date;}
    set setId(id: string){this.id = id;}

    public static toUser(doc: IUserDoc): IUserObject {
        if(!doc) return null;
        return new User(doc.username, doc.tel, doc.email, doc.date, doc._id.toString());
    };

    public static toUsers(docs: IUserDoc[]): IUserObject[]{
        if(!docs) return null;
        return docs.map(doc => this.toUser(doc));
    };

    getUserModelStruct(){
        return new UserModel<IUserDoc>({
            username: this.username,
            tel: this.tel,
            email: this.email,
            date: this.date,
            _id: new Types.ObjectId(this.id)
        });
    }

    getDefaultUpdateObject(){
        return {
            username: this.username,
            tel: this.tel,
            email: this.email,
            date: this.date
        };
    }

    async saveToDB(): Promise<IUserObject> {
        try {
            const result = await DB.postToDB<IUserDoc>(this.getUserModelStruct());
            return Promise.resolve(User.toUser(result.data));
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

    async updateToDB(): Promise<IUpdateOne> {
        try {
            const result = await DB.updateOne<IUserDoc>(UserModel, this.id, this.getDefaultUpdateObject());
            return Promise.resolve(result);
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

    async deleteFromDB(): Promise<DeleteResult> {
        try {
            const result = await DB.deleteFromDB<IUserDoc>(UserModel, this.id);
            return Promise.resolve(result);
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

    static async deleteFromDB(id: string): Promise<DeleteResult>{
        try {
            const result = await DB.deleteFromDB<IUserDoc>(UserModel, id);
            return Promise.resolve(result);
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

    static async findOneUserFromDBById(id: string): Promise<IUserObject> {
        try {
            const data = await DB.findOne<IUserDoc>(UserModel, {_id: id});
            const audio = _.isEmpty(data) ? null : data;
            return Promise.resolve(User.toUser(audio));
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

    static async findOneUserFromDBByUsername(username: string): Promise<IUserObject> {
        try {
            let data = await DB.findOne<IUserDoc>(UserModel, {username: username});
            let audio = _.isEmpty(data) ? null : data;
            return Promise.resolve(User.toUser(audio));
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

    static async getUsers(
        username: string, 
        tel: string, 
        email: string, 
        dateParams: {date: Moment, gte: boolean}, 
        skipNumber: number, 
        limitNumber: number): Promise<IUserObject[]> {
        try {

            let queryStruct = {};

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

            let data = await DB.findMany<IUserDoc>(UserModel, queryStruct, null, null, skipNumber, limitNumber);
            if(_.isEmpty(data)){
                data = null;
            }
            return Promise.resolve(User.toUsers(data));
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