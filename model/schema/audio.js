let mongoose = require("mongoose");

let AudioSchema = mongoose.Schema({
    uri:{
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true,
        max: 500
    },
    date: {
        type: Date,
        default: Date.now()
    },
    keywords: {
        type: [String],
        required: true,
        max: 25
    }
});

module.exports = mongoose.model("Audio", AudioSchema);