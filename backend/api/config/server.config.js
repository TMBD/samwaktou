const SERVEUR_CONFIG = {
    PORT: 8080
}

const HTTP_CODE = {
    OK: 200,
    INTERNAL_SERVER_ERROR: 500,
    PAGE_NOT_FOUND_ERROR: 404,
    BAD_REQUEST_ERROR: 400,
    ACCESS_DENIED_ERROR: 401
}

const FILE_LOCATION = {
    AUDIO_FILE_LOCATION: "files/audios/"
}

const AUDIO_FILE_PARAMS = {
    MAX_FILE_SIZE: 100*1024*1024 // = 100Mo
}

const AUDIO_GET_PARAMS = {
    MAX_LIMIT_NUMBER: 100,
    DEFAULT_LIMIT_NUMBER: 20,
    DEFAULT_SKIP_NUMBER: 0
}

const ADMIN_VALIDATION_CONFIG = {
    MAX_SURNAME_CHAR: 255,
    MIN_SURNAME_CHAR: 1,
    MAX_NAME_CHAR: 255,
    MIN_NAME_CHAR: 1,
    MAX_PASSWORD_CHAR: 1024,
    MIN_PASSWORD_CHAR: 5,
    MAX_EMAIL_CHAR: 255,
    MIN_EMAIL_CHAR: 1
}

const AUDIO_VALIDATION_CONFIG = {
    MAX_DESCRIPTION_CHAR: 500,
    MIN_DESCRIPTION_CHAR: 10,
    MAX_KEYWORDS_CHAR: 500,
    MIN_KEYWORDS_CHAR: 10,
    MAX_THEME_CHAR: 30,
    MIN_THEME_CHAR: 2,
    MAX_AUTHOR_CHAR: 30,
    MIN_AUTHOR_CHAR: 1

}

const ADMIN_GET_PARAMS = {
    MAX_LIMIT_NUMBER: 100,
    DEFAULT_LIMIT_NUMBER: 10,
    DEFAULT_SKIP_NUMBER: 0
}

const USER_VALIDATION_CONFIG = {
    MAX_USERNAME_CHAR: 255,
    MIN_USERNAME_CHAR: 1,
    MAX_INTERESTKEYWORDS_CHAR: 255,
    MIN_INTERESTKEYWORDS_CHAR: 1,
    MIN_TEL_CHAR: 5,
    MAX_TEL_CHAR: 20,
    MAX_EMAIL_CHAR: 255,
    MIN_EMAIL_CHAR: 1
}
const USER_GET_PARAMS = {
    MAX_LIMIT_NUMBER: 100,
    DEFAULT_LIMIT_NUMBER: 10,
    DEFAULT_SKIP_NUMBER: 0
}

exports.SERVEUR_CONFIG = SERVEUR_CONFIG;
exports.HTTP_CODE = HTTP_CODE;
exports.FILE_LOCATION = FILE_LOCATION;
exports.AUDIO_FILE_PARAMS = AUDIO_FILE_PARAMS;
exports.AUDIO_GET_PARAMS = AUDIO_GET_PARAMS;
exports.ADMIN_VALIDATION_CONFIG = ADMIN_VALIDATION_CONFIG;
exports.ADMIN_GET_PARAMS = ADMIN_GET_PARAMS;
exports.AUDIO_VALIDATION_CONFIG = AUDIO_VALIDATION_CONFIG;
exports.USER_VALIDATION_CONFIG = USER_VALIDATION_CONFIG;
exports.USER_GET_PARAMS = USER_GET_PARAMS;