let connectToDB = require("./db-connection");

const DB = {
    postToDB: async (collection) => {
        try{
            await connectToDB();
            let data = await collection.save();
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

    deleteFromDB: async (collection, id) => {
        try {
            await connectToDB();
            let removedCollection = await collection.deleteOne({_id: id});
            return Promise.resolve({removedCollection});
        } catch (deleteError) {
            return Promise.reject({
                success: false,
                reason: "Couldn't delete object from the db !",
                message: "Une erreur s'est produite lors de la suppression des informations.",
                details: deleteError
            });
        }
    },

    updateOne: async (collection, id, struct) => {
        try {
            await connectToDB();
            let updatedCollection = await collection.updateOne(
                {_id: id},
                {$set: struct}
            );
            return Promise.resolve(updatedCollection);
        } catch (updateError) {
            return Promise.reject({
                success: false,
                reason: "Couldn't update object from the db !",
                message: "Une erreur s'est produite lors de la mise à jour des informations.",
                details: updateError
            });
        }
    },

    findOne: async (collection, query) => {
        try {
            await connectToDB();
            let result = await collection.findOne(query);
            return Promise.resolve(result);
        } catch (findError) {
            return Promise.reject({
                success: false,
                reason: "Couldn't find object from the db !",
                message: "Une erreur s'est produite lors de la récupération des informations.",
                details: findError
            });
        }
    },

    findMany: async (collection, query, fieldsToReturn, sort, skipNumber, limitNumber) => {
        try {
            await connectToDB();
            let result = await collection.find(query, fieldsToReturn, {sort: sort, skip: skipNumber, limit: limitNumber });
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

    getDistinctValuesForField: async (collection, fieldName) => {
        try {
            await connectToDB();
            let result = await collection.distinct(fieldName);
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

    findLatestRecords: async (collection, query, fieldsToReturn, skipNumber, limitNumber) => {
        try {
            await connectToDB();
            let result = await collection.find(query, fieldsToReturn, { sort: { date: -1, _id: 1 }, skip: skipNumber, limit: limitNumber });
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


module.exports = DB;