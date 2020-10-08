let mongoose = require("mongoose");
let connectToDB = require("./connect_to_db");

const DB = {
    postToDB: (collection, callBack) => {
        try {
            connectToDB(() => {
                console.log("connected to the db");
                collection.save()
                .then((data) => {
                    let result = {
                        success: true,
                        data: data,
                    }
                    console.log(result);
                    callBack(result);
                })
                .catch((saveError) => {
                    let result = {
                        success: false,
                        message: saveError,
                        details: "Couldn't save object to the db !"
                    }
                    callBack(result);
                });
            })
        } catch (dbConnectionError) {
            let result = {
                success: false,
                message: dbConnectionError,
                details: "Couldn't save object to the db !"
            }
            callBack(result);
        }
        
    }
}



module.exports = DB;