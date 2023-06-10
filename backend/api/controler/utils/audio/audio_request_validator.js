let _ = require("lodash");
let moment = require("moment");
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
    if(!_.trim(body.keywords)){
        return {
            success: false,
            details: "keywords field contains only whitespace characters !"
        };
    }
    if(body.date && !moment(body.date, "DD-MM-YYYY").isValid()){
        return {
            success: false,
            details: "date field has to a valid date of format DD-MM-YYYY !"
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
    let body = req.query;
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
    
    if(body.minDate && !moment(body.minDate, "DD-MM-YYYY").isValid()){
        return {
            success: false,
            details: "minDate has to be of type Date !"
        };
    }
    if(body.maxDate && !moment(body.maxDate, "DD-MM-YYYY").isValid()){
        return {
            success: false,
            details: "maxDate has to be of type Date !"
        };
    }
    if(body.minDate && body.maxDate && !moment(body.minDate, "DD-MM-YYYY").isSameOrBefore(moment(body.maxDate, "DD-MM-YYYY"), "day")){
        return {
            success: false,
            details: "maxDate has to be after minDate !"
        };
    }

    if(body.limit !== undefined){
        if(!isNaN(body.limit) && !isNaN(parseInt(body.limit, 10))){
            if(parseInt(body.limit, 10) <= 0){
                return {
                    success: false,
                    details: "limit field  should be an integer and greater than 0 !"
                };
            }
            if(parseInt(body.limit, 10)>CONFIG.AUDIO_GET_PARAMS.MAX_LIMIT_NUMBER){
                return {
                    success: false,
                    details: "limit field can't exceed "+CONFIG.AUDIO_GET_PARAMS.MAX_LIMIT_NUMBER+" !"
                };
            }
        }else{
            return {
                success: false,
                details: "limit field should be a valid number !"
            };
        }
        
    }

    if(body.skip !== undefined){
        if(!isNaN(body.skip) && !isNaN(parseInt(body.skip, 10))){
            if(parseInt(body.skip, 10) < 0){
                return {
                    success: false,
                    details: "skip field should a positive integer !"
                };
            }
        }else{
            return {
                success: false,
                details: "skip field should be a valid number !"
            };
        }
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
    
    if(!body.keywords){
        return {
            success: false,
            details: "keywords field is required !"
        };
    }
    if(!_.trim(body.keywords)){
        return {
            success: false,
            details: "keywords field contains only whitespace characters !"
        };
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