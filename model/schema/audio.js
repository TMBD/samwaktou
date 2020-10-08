let mongoose = require("mongoose");

let AudioSchema = mongoose.Schema({
    uri:{
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now()
    },
    keywords: {
        type: [String],
        required: true
    }
});

module.exports = mongoose.model("Post", AudioSchema);