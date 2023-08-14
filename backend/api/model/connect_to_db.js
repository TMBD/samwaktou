let mongoose = require("mongoose");

const connectToDB = () => {
    mongoose.connect(process.env.DB_CONNECTION, 
    {
        authSource: "admin",
        user: process.env.MONGODB_USERNAME,
        pass: process.env.MONGODB_PASSWORD,
        dbName: process.env.MONGODB_DB_NAME,
        useNewUrlParser: true, 
        useUnifiedTopology: true
    }, (err) => {
        if(err) return Promise.reject(err);
    });
}

module.exports = connectToDB;