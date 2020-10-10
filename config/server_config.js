const SERVEUR_CONFIG = {
    PORT: 8080
}

const HTTP_CODE = {
    OK: 200,
    INTERNAL_SERVER_ERROR: 500,
    PAGE_NOT_FOUND_ERROR: 404,
    BAD_REQUEST_ERROR: 400
}

const FILE_LOCATION = {
    AUDIO_FILE_LOCATION: "files/audios/"
}

const AUDIO_FILE_PARAMS = {
    MAX_FILE_SIZE: 100*1024*1024 // = 100Mo
}

const AUDIO_GET_PARAMS = {
    MAX_LIMIT_NUMBER: 100
}

exports.SERVEUR_CONFIG = SERVEUR_CONFIG;
exports.HTTP_CODE = HTTP_CODE;
exports.FILE_LOCATION = FILE_LOCATION;
exports.AUDIO_FILE_PARAMS = AUDIO_FILE_PARAMS;
exports.AUDIO_GET_PARAMS = AUDIO_GET_PARAMS;