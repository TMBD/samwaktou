let mongoose = require("mongoose");
let {AUDIO_VALIDATION_CONFIG} = require("../../config/server_config");

let AudioSchema = mongoose.Schema({
    uri:{
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true,
        max: AUDIO_VALIDATION_CONFIG.MAX_TITLE_CHAR,
        min: AUDIO_VALIDATION_CONFIG.MIN_TITLE_CHAR
    },
    theme: {
        type: String,
        required: true,
        max: AUDIO_VALIDATION_CONFIG.MAX_THEME_CHAR,
        min: AUDIO_VALIDATION_CONFIG.MIN_THEME_CHAR
    },
    author: {
        type: String,
        required: false,
        max: AUDIO_VALIDATION_CONFIG.MAX_AUTHOR_CHAR,
        min: AUDIO_VALIDATION_CONFIG.MIN_AUTHOR_CHAR,
        default: "Inconnu"
    },
    description: {
        type: String,
        required: true,
        max: AUDIO_VALIDATION_CONFIG.MAX_DESCRIPTION_CHAR,
        min: AUDIO_VALIDATION_CONFIG.MIN_DESCRIPTION_CHAR
    },
    date: {
        type: Date,
        default: Date.now()
    },
    keywords: {
        type: [String],
        required: true,
        max: AUDIO_VALIDATION_CONFIG.MAX_KEYWORDS_CHAR,
        min: AUDIO_VALIDATION_CONFIG.MIN_KEYWORDS_CHAR
    }
});

module.exports = mongoose.model("Audio", AudioSchema);