let _ = require("lodash");
const CONFIG = require("../../../config/server_config");


const validatePostAudioRequest = (req) => {
    let body = req.body;
    if(!body.description){
        return {
            success: false,
            details: "description field is required !"
        };
    }
    if(!_.isString(body.description)){
        return {
            success: false,
            details: "description field has to be string type!"
        };
    }
    if(body.description.length <CONFIG.AUDIO_VALIDATION_CONFIG.MIN_DESCRIPTION_CHAR 
        || body.description.length>CONFIG.AUDIO_VALIDATION_CONFIG.MAX_DESCRIPTION_CHAR){
        return {
            success: false,
            details: "The number of description characters must be between "+CONFIG.AUDIO_VALIDATION_CONFIG.MIN_DESCRIPTION_CHAR
            +" and "+CONFIG.AUDIO_VALIDATION_CONFIG.MAX_DESCRIPTION_CHAR
        };
    }
    if(!body.keywords){
        return {
            success: false,
            details: "keywords field is required !"
        };
    }
    if(! Array.isArray(body.keywords)){
        return {
            success: false,
            details: "keywords has to be an array of String !"
        };
    }
    if(req.files === undefined || req.files === null){
        return {
            success: false,
            details: "Your request has to include audio file !"
        };
    }
    if(req.files.audio === undefined || req.files.audio === null){
        return {
            success: false,
            details: "audio field is required !"
        };
    }
    if(!req.files.audio.mimetype.includes("audio")){
        return {
            success: false,
            details: "Only audio types are accepted !"
        };
    }
    return {success: true};
}

const validateGetAudioRequest = (req) => {
    let body = req.body;
    if(!body.keywords){
        return {
            success: false,
            details: "keywods is required if you don't provide the audio id !"
        };
    }
    if(!Array.isArray(body.keywords)){
        return {
            success: false,
            details: "keywods has to be an array of String !"
        };
    }

    if(body.limit !== undefined){
        if(!body.limit){
            return {
                success: false,
                details: "limit field is required and different to 0 !"
            };
        }
        if(body.limit>CONFIG.AUDIO_GET_PARAMS.MAX_LIMIT_NUMBER){
            return {
                success: false,
                details: "limit field can't exceed "+CONFIG.AUDIO_GET_PARAMS.MAX_LIMIT_NUMBER+" !"
            };
        }
    }
    
    if(body.skip !== undefined && !(body.skip || body.skip == 0)){
        return {
            success: false,
            details: "skip field is required !"
        };
    }
    return {success: true};
}

const validateUpdateAudioRequest = (req) => {
    let body = req.body;
    if(!body.description){
        return {
            success: false,
            details: "description field is required !"
        };
    } 
    if(!_.isString(body.description)){
        return {
            success: false,
            details: "description field has to be string type!"
        };
    }
    if(body.description.length <CONFIG.AUDIO_VALIDATION_CONFIG.MIN_DESCRIPTION_CHAR 
        || body.description.length>CONFIG.AUDIO_VALIDATION_CONFIG.MAX_DESCRIPTION_CHAR){
        return {
            success: false,
            details: "The number of description characters must be between "+CONFIG.AUDIO_VALIDATION_CONFIG.MIN_DESCRIPTION_CHAR
            +" and "+CONFIG.AUDIO_VALIDATION_CONFIG.MAX_DESCRIPTION_CHAR
        };
    }
    if(!body.keywords){
        return {
            success: false,
            details: "keywords field is required !"
        };
    }
    if(! Array.isArray(body.keywords)){
        return {
            success: false,
            details: "keywords has to be an array of String !"
        };
    }
    if(!body._id){
        return {
            success: false,
            details: "_id field is required !"
        };
    }

    return {
        success: true
    };
}
exports.validatePostAudioRequest = validatePostAudioRequest;
exports.validateGetAudioRequest = validateGetAudioRequest;
exports.validateUpdateAudioRequest = validateUpdateAudioRequest;