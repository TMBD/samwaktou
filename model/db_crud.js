let mongoose = require("mongoose");
let connectToDB = require("./connect_to_db");

const DB = {
    postToDB: async (collection) => {
        try {
            await connectToDB();
            console.log("connected to the db");
            try{
                let data = await collection.save();
                return Promise.resolve({
                    success: true,
                    data: data
                });
            }catch(saveError) {
                return Promise.resolve({
                    success: false,
                    message: saveError,
                    details: "Couldn't save object to the db !"
                });
            }
        } catch (dbConnectionError) {
            return Promise.resolve({
                success: false,
                message: dbConnectionError,
                details: "Couldn't connect to the db !"
            });
        }
        
    },

    deleteFromDB: async (collection, id) => {
        try {
            await connectToDB();
            let removedCollection = await collection.remove({_id: id});
            return Promise.resolve({removedCollection});
        } catch (deleteError) {
            return Promise.reject({message: deleteError});
        }
    },

    updateOne: async (collection, id, struct) => {
        try {
            await connectToDB();
            let updatedCollection = await collection.updateOne(
                {_id: id},
                {$set: struct}
            );
            console.log(struct);
            return Promise.resolve(updatedCollection);
        } catch (updateError) {
            return Promise.reject(updateError);
        }
    }

    
}



module.exports = DB;