require("dotenv/config");
let mongoose = require("mongoose");

const connectToDB = () => {
    // mongoose.connect('mongodb://'+process.env.MONGODB_USERNAME+':'+process.env.MONGODB_PASSWORD+'@127.0.0.1:27017/samwaktou', {useNewUrlParser: true, useUnifiedTopology: true}, (err) => {
    mongoose.connect('mongodb://127.0.0.1:27017/samwaktou', 
    {
        authSource: admin,
        user: "root",
        pass: "mypass",
        useNewUrlParser: true, 
        useUnifiedTopology: true
    }, (err) => {
        if(err) return Promise.reject(err);
    });
}

module.exports = connectToDB;