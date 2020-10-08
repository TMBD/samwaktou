let fs = require("fs");
let evenEmitter = require("events");
const SERVEUR_CONFIG = require("../../config/server_config");
let audioUtils = require("./audio_utils");
const rootDirPath = "../../";

const audioFileUploader = async(file, audioFileName) => {
    let audioUri = rootDirPath+SERVEUR_CONFIG.FILE_LOCATION.AUDIO_FILE_LOCATION+audioFileName;
    // let fileToCopy = "./data/fichier.mp3";
    // // let newFile = "./data/myCopy.mp3";
    // let streamReader = fs.createReadStream(fileToCopy);
    // let streamWriter = fs.createWriteStream(newFile);

    let streamReader = fs.createReadStream(file);
    let streamWriter = fs.createWriteStream(audioUri);

    try {
        //let fileStat = await audioUtils.getAudioStats(file);

        let progress = 0;
        streamReader.on("data", (chunk) => {
            progress += chunk.length;
            console.log("j'ai lu " + Math.floor(progress*100/size)+"%");
        });

        streamReader.pipe(streamWriter);

        streamReader.on("end", ()  => {
            Promise.resolve({
                success: true
            });
        });

    } catch (statError) {
        Promise.resolve({
            success: false,
            message: statError,
            details: "Error while trying to read the file meta-data"
        });
    }

}

module.exports = audioFileUploader;








