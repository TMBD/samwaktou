import { Document, Model, Types } from 'mongoose';
import { DeleteResult } from 'mongodb';

import connectToDB from './db-connection';


export interface IDocumentId {
    _id: Types.ObjectId;
}

export interface IUpdateOne {
    acknowledged: boolean,
    modifiedCount: number,
    upsertedId: any,
    upsertedCount: number,
    matchedCount: number,
}

export default {
    postToDB: async<T extends IDocumentId> (
        document: Document<Types.ObjectId, {}, T>): Promise<{success: boolean, data: T}> => {
        try{
            await connectToDB();
            const newDocument = await document.save();
            const data: T = newDocument.toObject<T>() as T;
            return Promise.resolve({
                success: true,
                data: data
            });
        }catch(saveError) {
            return Promise.reject({
                success: false,
                reason: "Couldn't save object to the db !",
                message: "Une erreur s'est produite lors de la sauvegarde des informations.",
                details: saveError
            });
        }
        
    },

    deleteFromDB: async<T extends IDocumentId> (
        model: Model<T>, 
        id: string): Promise<DeleteResult> => {
        try {
            await connectToDB();
            const deleteResult = await model.deleteOne({_id: id});
            return Promise.resolve(deleteResult);
        } catch (deleteError) {
            return Promise.reject({
                success: false,
                reason: "Couldn't delete object from the db !",
                message: "Une erreur s'est produite lors de la suppression des informations.",
                details: deleteError
            });
        }
    },    

    updateOne: async<T extends IDocumentId> (
        model: Model<T>, 
        id: string, 
        updateObject: {[p in keyof T]?: any}): Promise<IUpdateOne> => {
        try {
            await connectToDB();
            const updateResult: IUpdateOne = await model.updateOne(
                {_id: id}, 
                {$set: updateObject});
            return Promise.resolve(updateResult);
        } catch (updateError) {
            return Promise.reject({
                success: false,
                reason: "Couldn't update object from the db !",
                message: "Une erreur s'est produite lors de la mise à jour des informations.",
                details: updateError
            });
        }
    },

    findOne: async<T extends IDocumentId> (
        model: Model<T>, 
        query: object): Promise<T> => {
        try {
            await connectToDB();
            const document = await model.findOne(query);
            const data: T = document.toObject<T>() as T;
            return Promise.resolve(data);
        } catch (findError) {
            return Promise.reject({
                success: false,
                reason: "Couldn't find object from the db !",
                message: "Une erreur s'est produite lors de la récupération des informations.",
                details: findError
            });
        }
    },

    findMany: async<T extends IDocumentId> (
        model: Model<T>, 
        query: {[p in keyof T]?: any} | null, 
        fieldsToReturn: {[p in keyof T & string]?: number} | null,
        sort: {[p in keyof T & string]?: number} | null, 
        skipNumber: number, 
        limitNumber: number): Promise<T[]> => {
        try {
            await connectToDB();
            const result: T[] = await model.find(query, fieldsToReturn, {sort: sort, skip: skipNumber, limit: limitNumber });
            return Promise.resolve(result);
        } catch (findError) {
            return Promise.reject({
                success: false,
                reason: "Couldn't find objects from the db !",
                message: "Une erreur s'est produite lors de la récupération des informations.",
                details: findError
            });
        }
    },

    getDistinctValuesForField: async<T extends IDocumentId> (
        model: Model<T>, 
        fieldName: keyof T & string): Promise<unknown[]> => {
        try {
            await connectToDB();
            const result = await model.distinct(fieldName);
            return Promise.resolve(result);
        } catch (findError) {
            return Promise.reject({
                success: false,
                reason: "Couldn't find objects from the db !",
                message: "Une erreur s'est produite lors de la récupération des informations.",
                details: findError
            });
        }
    },

    findLatestRecords: async<T extends IDocumentId> (
        model: Model<T>, 
        query: {[p in keyof T]?: any} | null, 
        fieldsToReturn: {[p in keyof T & string]?: number} | null, 
        skipNumber: number, 
        limitNumber: number): Promise<T[]> => {
        try {
            await connectToDB();
            const result: T[] = await model.find(query, fieldsToReturn, { sort: { date: -1, _id: 1 }, skip: skipNumber, limit: limitNumber });
            return Promise.resolve(result);
        } catch (findError) {
            return Promise.reject({
                success: false,
                reason: "Couldn't find objects from the db !",
                message: "Une erreur s'est produite lors de la récupération des informations.",
                details: findError
            });
        }
    },
    
}