let mongoose = require("mongoose");
const {USER_VALIDATION_CONFIG} = require("../../config/server_config");

let UserSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        min: USER_VALIDATION_CONFIG.MIN_USERNAME_CHAR,
        max: USER_VALIDATION_CONFIG.MAX_USERNAME_CHAR
    },
    tel: {
        type: String,
        required: true,
        min: USER_VALIDATION_CONFIG.MIN_TEL_CHAR,
        max: USER_VALIDATION_CONFIG.MAX_TEL_CHAR
    },
    email: {
        type: String,
        required: false,
        min: USER_VALIDATION_CONFIG.MIN_EMAIL_CHAR,
        max: USER_VALIDATION_CONFIG.MAX_EMAIL_CHAR
    },
    interestKeywords: {
        type: [String],
        required: false,
        max: USER_VALIDATION_CONFIG.MAX_INTERESTKEYWORDS_CHAR,
        min: USER_VALIDATION_CONFIG.MIN_INTERESTKEYWORDS_CHAR
    },
    date: {
        type: Date,
        default: Date.now()
    }
});

module.exports = mongoose.model("User", UserSchema);