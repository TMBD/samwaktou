let mongoose = require("mongoose");
let connectToDB = require("./connect_to_db");

const DB = {
    postToDB: async (collection) => {
        try {
            await connectToDB();
        } catch (dbConnectionError) {
            return Promise.reject({
                success: false,
                message: dbConnectionError,
                details: "Couldn't connect to the db !"
            });
        }
        try{
            let data = await collection.save();
            return Promise.resolve({
                success: true,
                data: data
            });
        }catch(saveError) {
            return Promise.reject({
                success: false,
                message: saveError,
                details: "Couldn't save object to the db !"
            });
        }
        
    },

    deleteFromDB: async (collection, id) => {
        try {
            await connectToDB();
        } catch (dbConnectionError) {
            return Promise.reject({
                success: false,
                message: dbConnectionError,
                details: "Couldn't connect to the db !"
            });
        }
        try {
            let removedCollection = await collection.deleteOne({_id: id});
            return Promise.resolve({removedCollection});
        } catch (deleteError) {
            return Promise.reject({message: deleteError});
        }
    },

    updateOne: async (collection, id, struct) => {
        try {
            await connectToDB();
        } catch (dbConnectionError) {
            return Promise.reject({
                success: false,
                message: dbConnectionError,
                details: "Couldn't connect to the db !"
            });
        }
        try {
            let updatedCollection = await collection.updateOne(
                {_id: id},
                {$set: struct}
            );
            return Promise.resolve(updatedCollection);
        } catch (updateError) {
            return Promise.reject(updateError);
        }
    },

    findOne: async (collection, query) => {
        try {
            await connectToDB();
        } catch (dbConnectionError) {
            return Promise.reject({
                success: false,
                message: dbConnectionError,
                details: "Couldn't connect to the db !"
            });
        }
        try {
            let result = await collection.findOne(query);
            return Promise.resolve(result);
        } catch (findError) {
            return Promise.reject(findError);
        }
    },

    findMany: async (collection, query, fieldsToReturn, sort, skipNumber, limitNumber) => {
        try {
            await connectToDB();
        } catch (dbConnectionError) {
            return Promise.reject({
                success: false,
                message: dbConnectionError,
                details: "Couldn't connect to the db !"
            });
        }
        try {
            let result = await collection.find(query, fieldsToReturn, {sort: sort, skip: skipNumber, limit: limitNumber });
            return Promise.resolve(result);
        } catch (findError) {
            return Promise.reject(findError);
        }
    },

    findLatestRecords: async (collection, query, fieldsToReturn, skipNumber, limitNumber) => {
        try {
            await connectToDB();
        } catch (dbConnectionError) {
            return Promise.reject({
                success: false,
                message: dbConnectionError,
                details: "Couldn't connect to the db !"
            });
        }
        try {
            let result = await collection.find(query, fieldsToReturn, {sort: { 'date' : -1 }, skip: skipNumber, limit: limitNumber });
            return Promise.resolve(result);
        } catch (findError) {
            return Promise.reject(findError);
        }
    },

    
}



module.exports = DB;