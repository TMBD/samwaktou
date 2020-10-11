let Joi = require("@hapi/joi");
const {ADMIN_VALIDATION_CONFIG} = require("../../../config/server_config");

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
    });

    return schema.validate(body);
}

const validateLoginAdminRequest = (body) => {
    const schema = Joi.object({
        email: Joi.string()
            .required()
            .email(),
        password: Joi.string()
            .min(ADMIN_VALIDATION_CONFIG.MIN_PASSWORD_CHAR)
            .max(ADMIN_VALIDATION_CONFIG.MAX_PASSWORD_CHAR)
            .required(),
    });
    return schema.validate(body);
}

exports.validatePostAdminRequest = validatePostAdminRequest;
exports.validateLoginAdminRequest = validateLoginAdminRequest;
