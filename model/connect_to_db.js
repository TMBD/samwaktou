require("dotenv/config");
let mongoose = require("mongoose");

const connectToDB = () => {
    mongoose.connect(process.env.DB_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
        if(err) return Promise.reject(err);
    });
}

module.exports = connectToDB;
