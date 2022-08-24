const SERVEUR_CONFIG = require("../../../config/server_config");

const audioFileUploader = async(file, audioFileName) => {
    var audioUri = SERVEUR_CONFIG.FILE_LOCATION.AUDIO_FILE_LOCATION+audioFileName;
    try {
        await file.mv(audioUri);
        return Promise.resolve({ 
            success: true,
            uri: audioUri
        });
    } catch (uploadError) {
        return Promise.resolve({ 
            success: false,
            message: uploadError,
            details: "Couldn't upload the file in the server"
        });
    }
}

module.exports = audioFileUploader;








