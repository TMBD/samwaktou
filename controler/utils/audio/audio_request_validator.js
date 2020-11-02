let _ = require("lodash");
const CONFIG = require("../../../config/server_config");


const validatePostAudioRequest = (req) => {
    let body = req.body;
    if(!body.title){
        return {
            success: false,
            details: "title field is required !"
        };
    }
    if(!_.isString(body.title)){
        return {
            success: false,
            details: "title field has to be string type !"
        };
    }
    if(body.title.length <CONFIG.AUDIO_VALIDATION_CONFIG.MIN_TITLE_CHAR
        || body.title.length>CONFIG.AUDIO_VALIDATION_CONFIG.MAX_TITLE_CHAR){
        return {
            success: false,
            details: "The number of title characters must be between "+CONFIG.AUDIO_VALIDATION_CONFIG.MIN_TITLE_CHAR
            +" and "+CONFIG.AUDIO_VALIDATION_CONFIG.MAX_TITLE_CHAR
        };
    }


    if(!body.theme){
        return {
            success: false,
            details: "theme field is required !"
        };
    }
    if(!_.isString(body.theme)){
        return {
            success: false,
            details: "theme field has to be string type !"
        };
    }
    if(body.theme.length <CONFIG.AUDIO_VALIDATION_CONFIG.MIN_THEME_CHAR
        || body.theme.length>CONFIG.AUDIO_VALIDATION_CONFIG.MAX_THEME_CHAR){
        return {
            success: false,
            details: "The number of theme characters must be between "+CONFIG.AUDIO_VALIDATION_CONFIG.MIN_THEME_CHAR
            +" and "+CONFIG.AUDIO_VALIDATION_CONFIG.MAX_THEME_CHAR
        };
    }


    if(body.author){
        if(!_.isString(body.author)){
            return {
                success: false,
                details: "author field has to be string type !"
            };
        }
        if(body.author.length <CONFIG.AUDIO_VALIDATION_CONFIG.MIN_AUTHOR_CHAR
            || body.author.length>CONFIG.AUDIO_VALIDATION_CONFIG.MAX_AUTHOR_CHAR){
            return {
                success: false,
                details: "The number of author characters must be between "+CONFIG.AUDIO_VALIDATION_CONFIG.MIN_AUTHOR_CHAR
                +" and "+CONFIG.AUDIO_VALIDATION_CONFIG.MAX_AUTHOR_CHAR
            };
        }
    }
    

    if(!body.description){
        return {
            success: false,
            details: "description field is required !"
        };
    }
    if(!_.isString(body.description)){
        return {
            success: false,
            details: "description field has to be string type !"
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
    if(body.keywords.length <1){
        return {
            success: false,
            details: "keywords has to have at least one element !"
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
    if(body.theme){
        if(!_.isString(body.theme)){
            return {
                success: false,
                details: "theme has to be type of String !"
            };
        }
    }
    if(body.author){
        if(!_.isString(body.author)){
            return {
                success: false,
                details: "author has to be type of String !"
            };
        }
    }
    if(body.keywords){
        if(!Array.isArray(body.keywords)){
            return {
                success: false,
                details: "keywods has to be an array of String !"
            };
        }
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
    if(body.title){
        if(!_.isString(body.title)){
            return {
                success: false,
                details: "title field has to be string type !"
            };
        }
        if(body.title.length <CONFIG.AUDIO_VALIDATION_CONFIG.MIN_TITLE_CHAR
            || body.title.length>CONFIG.AUDIO_VALIDATION_CONFIG.MAX_TITLE_CHAR){
            return {
                success: false,
                details: "The number of title characters must be between "+CONFIG.AUDIO_VALIDATION_CONFIG.MIN_TITLE_CHAR
                +" and "+CONFIG.AUDIO_VALIDATION_CONFIG.MAX_TITLE_CHAR
            };
        }
    }
    

    if(body.theme){
        if(!_.isString(body.theme)){
            return {
                success: false,
                details: "theme field has to be string type !"
            };
        }
        if(body.theme.length <CONFIG.AUDIO_VALIDATION_CONFIG.MIN_THEME_CHAR
            || body.theme.length>CONFIG.AUDIO_VALIDATION_CONFIG.MAX_THEME_CHAR){
            return {
                success: false,
                details: "The number of theme characters must be between "+CONFIG.AUDIO_VALIDATION_CONFIG.MIN_THEME_CHAR
                +" and "+CONFIG.AUDIO_VALIDATION_CONFIG.MAX_THEME_CHAR
            };
        }
    }

    if(body.author){
        if(!_.isString(body.author)){
            return {
                success: false,
                details: "author field has to be string type !"
            };
        }
        if(body.author.length <CONFIG.AUDIO_VALIDATION_CONFIG.MIN_AUTHOR_CHAR
            || body.author.length>CONFIG.AUDIO_VALIDATION_CONFIG.MAX_AUTHOR_CHAR){
            return {
                success: false,
                details: "The number of author characters must be between "+CONFIG.AUDIO_VALIDATION_CONFIG.MIN_AUTHOR_CHAR
                +" and "+CONFIG.AUDIO_VALIDATION_CONFIG.MAX_AUTHOR_CHAR
            };
        }
    }
    

    if(body.description){
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
    } 
    
    if(body.keywords){
        if(! Array.isArray(body.keywords)){
            return {
                success: false,
                details: "keywords has to be an array of String !"
            };
        }
    }
    
    if(body.title || body.theme || body.author || body.description || body.keywords || body.date) {
        return {
            success: true
        };
    }
    return {
        success: false,
        details: "No field has been set !"
    }
    
}
exports.validatePostAudioRequest = validatePostAudioRequest;
exports.validateGetAudioRequest = validateGetAudioRequest;
exports.validateUpdateAudioRequest = validateUpdateAudioRequest;