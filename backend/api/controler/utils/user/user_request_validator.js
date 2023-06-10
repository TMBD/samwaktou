let Joi = require("@hapi/joi");
const {USER_VALIDATION_CONFIG, USER_GET_PARAMS} = require("../../../config/server_config");

const validatePostUserRequest = (body) => {
    const schema = Joi.object({
        username: Joi.string()
            .min(USER_VALIDATION_CONFIG.MIN_USERNAME_CHAR)
            .max(USER_VALIDATION_CONFIG.MAX_USERNAME_CHAR)
            .required(),
        tel: Joi.string()
            .min(USER_VALIDATION_CONFIG.MIN_TEL_CHAR)
            .max(USER_VALIDATION_CONFIG.MAX_TEL_CHAR)
            .required(),    
        email: Joi.string()
            .email(),
        date: Joi.date(),
    });
    return schema.validate(body);
}

const validateGetUserRequest = (body) => {
    const schema = Joi.object({
        username: Joi.string(),
        tel: Joi.string(),    
        email: Joi.string()
            .email(),
        interestParams: Joi.object()
            .keys({
                keywords: Joi.array()
                    .required(),
                matchAll: Joi.boolean(),
            }),
        dateParams: Joi.object()
            .keys({
                date: Joi.date()
                    .required(),
                gte: Joi.boolean(),
            }),
        limit: Joi.number()
            .max(USER_GET_PARAMS.MAX_LIMIT_NUMBER),
        skip: Joi.number()
    });
    return schema.validate(body);
}


const validateUpdateUserRequest = (body) => {
    const schema = Joi.object({
        username: Joi.string()
            .min(USER_VALIDATION_CONFIG.MIN_USERNAME_CHAR)
            .max(USER_VALIDATION_CONFIG.MAX_USERNAME_CHAR)
            .required(),
        tel: Joi.string()
            .min(USER_VALIDATION_CONFIG.MIN_TEL_CHAR)
            .max(USER_VALIDATION_CONFIG.MAX_TEL_CHAR),    
        email: Joi.string()
            .email(),
    });
    return schema.validate(body);
}


const validateLoginUserRequest = (body) => {
    const schema = Joi.object({
        username: Joi.string()
            .required(),
        tel: Joi.string()
            .required(),
    });
    return schema.validate(body);
}



exports.validatePostUserRequest = validatePostUserRequest;
exports.validateGetUserRequest = validateGetUserRequest;
exports.validateUpdateUserRequest = validateUpdateUserRequest;
exports.validateLoginUserRequest = validateLoginUserRequest;
