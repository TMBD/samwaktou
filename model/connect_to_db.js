require("dotenv/config");
let mongoose = require("mongoose");

const connectToDB = (callBack) => {
    mongoose.connect(process.env.DB_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
        if(err) throw err;
        callBack();
        // audio.save()
        // .then((data) => {
        //     res.status(200);
        //     res.json(data);
        // })
        // .catch((err) => {
        //     res.json({message: err});
        // });
    });
}

module.exports = connectToDB;
