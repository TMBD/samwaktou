let Joi = require("@hapi/joi");
const {ADMIN_VALIDATION_CONFIG, ADMIN_GET_PARAMS} = require("../../../config/server.config");

const validatePostAdminRequest = (body) => {
    const schema = Joi.object({
        surname: Joi.string()
            .min(ADMIN_VALIDATION_CONFIG.MIN_SURNAME_CHAR)
            .max(ADMIN_VALIDATION_CONFIG.MAX_SURNAME_CHAR)
            .required(),
        name: Joi.string()
            .min(ADMIN_VALIDATION_CONFIG.MIN_NAME_CHAR)
            .max(ADMIN_VALIDATION_CONFIG.MAX_NAME_CHAR)
            .required(),
        email: Joi.string()
            .required()
            .email(),
        password: Joi.string()
            .min(ADMIN_VALIDATION_CONFIG.MIN_PASSWORD_CHAR)
            .max(ADMIN_VALIDATION_CONFIG.MAX_PASSWORD_CHAR)
            .required(),
        date: Joi.date(),
        isSuperAdmin: Joi.boolean(),
    });
    return schema.validate(body);
}

const validateGetAdminRequest = (body) => {
    const schema = Joi.object({
        surname: Joi.string(),
        name: Joi.string(),
        email: Joi.string()
            .email(),
        dateParams: Joi.object()
            .keys({
                date: Joi.date()
                    .required(),
                gte: Joi.boolean(),
            }),
        isSuperAdmin: Joi.boolean(),
        limit: Joi.number()
            .max(ADMIN_GET_PARAMS.MAX_LIMIT_NUMBER),
        skip: Joi.number()
    });
    return schema.validate(body);
}


const validateUpdateAdminRequest = (body) => {
    const schema = Joi.object({
        surname: Joi.string()
            .min(ADMIN_VALIDATION_CONFIG.MIN_SURNAME_CHAR)
            .max(ADMIN_VALIDATION_CONFIG.MAX_SURNAME_CHAR),
        name: Joi.string()
            .min(ADMIN_VALIDATION_CONFIG.MIN_NAME_CHAR)
            .max(ADMIN_VALIDATION_CONFIG.MAX_NAME_CHAR),
        email: Joi.string()
            .email(),
        isSuperAdmin: Joi.boolean(),
    });
    return schema.validate(body);
}

const validateUpdateAdminPasswordRequest = (body) => {
    const schema = Joi.object({
        password: Joi.string()
            .required(),
        newPassword: Joi.string()
            .min(ADMIN_VALIDATION_CONFIG.MIN_PASSWORD_CHAR)
            .max(ADMIN_VALIDATION_CONFIG.MAX_PASSWORD_CHAR)
            .required()
    });
    return schema.validate(body);
}

const validateLoginAdminRequest = (body) => {
    const schema = Joi.object({
        email: Joi.string()
            .required()
            .email(),
        password: Joi.string()
            .required(),
    });
    return schema.validate(body);
}

exports.validatePostAdminRequest = validatePostAdminRequest;
exports.validateLoginAdminRequest = validateLoginAdminRequest;
exports.validateGetAdminRequest = validateGetAdminRequest;
exports.validateUpdateAdminRequest = validateUpdateAdminRequest;
exports.validateUpdateAdminPasswordRequest = validateUpdateAdminPasswordRequest;
