let express = require("express");
let router = express.Router();
let Audio = require("../models/Audio");
require("dotenv/config");
let mongoose = require("mongoose");

router.post("/", (req, res) => {
    
    console.log(" the console");
    
    let audio = new Audio({
        uri: req.body.uri,
        description: req.body.description,
        keywords: req.body.keywords,
        date: req.body.date
    });
    //console.log(process.env.DB_CONNECTION);
    mongoose.connect(process.env.DB_CONNECTION, { useNewUrlParser: true,  }, (err) => {
        if(err) console.log("not connected");
        else{
            console.log("connected to the db");
            //res.send(err);
            audio.save()
            .then((data) => {
                res.status(200);
                res.json(data);
            })
            .catch((err) => {
                res.json({message: err});
            });
        } 
    });

});

module.exports = router;