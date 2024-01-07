let _ = require("lodash");
const { PassThrough } = require('stream');
let Audio = require("../model/audio.model");
const CONFIG = require("../config/server.config");
let requestValidator = require("./utils/audio/audio-request-validator");
let {uploadAudioFileInternal, getAudioFileInternal, getAudioFileMetadataInternal, removeAudioFileInternal, downloadAudioFileInternal} = require("./utils/audio/audio-file-handler");
let audioUtils = require("./utils/audio/audio-utils");
const rootDirPath = "../";

let postAudio = async (req, res) => {
    let reqValidation = requestValidator.validatePostAudioRequest(req);
    if(reqValidation.success){
        var audio = new Audio(req.body.uri, req.body.theme, req.body.author, req.body.description, req.body.keywords, req.body.date, null);
        let result = await audio.saveToDB();
        if(result.success){
            const splitedFileName = _.split(req.files.audio.name, ".");
            const fileExtension = splitedFileName[splitedFileName.length-1];
            let uploadResult = await uploadAudioFileInternal(req.files.audio, result.data._id+"."+fileExtension);
            if(uploadResult.success){
                audio.setUri(uploadResult.uri);
                let updateResult = await audio.updateToDB();
                if(updateResult.success){
                    result.data.uri = audio.getUri();
                    res.status(CONFIG.HTTP_CODE.OK);
                    res.json(result.data);
                }else{
                    //Reflechire plutard sur cette partie pour voir si je vais supprimer de nouveau le fichier dans le serveur 
                    //et l'enregistrement correspondant dans la base de données...
                    res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
                    res.json({
                        message: updateResult.message,
                        details: "An error has occure while trying to update the file uri in the database after it has been saved in the sever !"
                    });
                }
            }else{
                let deleteResult = await audio.deleteFromDB(); //deleteResult n'est pas encore utilisé ici parce que j'en ai pas encnore besoin
                res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
                res.json({
                    message: uploadResult.message,
                    details: uploadResult.details
                });
            }
        }else{
            res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
            res.json({
                message: result.message,
                details: result.details
            });
        }
    }else{
        res.status(CONFIG.HTTP_CODE.BAD_REQUEST_ERROR);
        res.json({
            message: "BAD REQUEST ERROR, PLEASE VERIFY YOUR REQUEST AND ENSURE THAT ALL THE FIELDS ARE SETUP WELL !", 
            details: reqValidation.details
        });
    }
}

let getAudio = async (req, res) => {
    if(req.params.audioId){
        let findAudioResult = await Audio.findOneAudioFromDBById(req.params.audioId);
        if(findAudioResult.success){
            if(findAudioResult.audio === null){
                res.status(CONFIG.HTTP_CODE.PAGE_NOT_FOUND_ERROR);
                res.json({});
            }else{
                res.status(CONFIG.HTTP_CODE.OK);
                res.json(findAudioResult.audio);
            }
        }
        else{
            res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
            res.json({
                message: findAudioResult.message,
                details: findAudioResult.details
            });
        }

    }else{
        res.status(CONFIG.HTTP_CODE.BAD_REQUEST_ERROR);
        res.json({
            message: "BAD REQUEST ERROR, PLEASE VERIFY YOUR REQUEST AND ENSURE THAT ALL THE FIELDS ARE SETUP WELL !", 
            details: "No audio id found"
        });
    }
}

let getManyAudios = async(req, res) => {
    let reqValidation = requestValidator.validateGetAudioRequest(req);
    if(reqValidation.success){
        let skip = req.query.skip ? parseInt(req.query.skip, 10) : CONFIG.AUDIO_GET_PARAMS.DEFAULT_SKIP_NUMBER;
        let limit = req.query.limit ? parseInt(req.query.limit, 10) : CONFIG.AUDIO_GET_PARAMS.DEFAULT_LIMIT_NUMBER;
        let findAudiosResults;
        findAudiosResults = await Audio.findAudiosFromDB(req.query.theme, req.query.author, req.query.keywords, req.query.minDate, req.query.maxDate, skip, limit);
        if(findAudiosResults.success){
            if(findAudiosResults.audios === null){
                res.status(CONFIG.HTTP_CODE.OK);
                res.json([]);
            }else{
                res.status(CONFIG.HTTP_CODE.OK);
                res.json(findAudiosResults.audios);
            }
        }else{
            res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
            res.json({
                message: findAudiosResults.message,
                details: findAudiosResults.details
            });
        }
    }else{
        res.status(CONFIG.HTTP_CODE.BAD_REQUEST_ERROR);
        res.json({
            message: "BAD REQUEST ERROR, PLEASE VERIFY YOUR REQUEST AND ENSURE THAT ALL THE FIELDS ARE SETUP WELL !", 
            details: reqValidation.details
        });
    }
}

let getAudioFile = async (req, res) => {
    let fileName = req.params.fileName;
    if(fileName){
        const CHUNK_SIZE = 500000; // ~500KB
        const metadata = await getAudioFileMetadataInternal(fileName);
        if(metadata?.success){
            let startByte = 0;
            let endByte = metadata.data.ContentLength - 1;
            if (req.headers?.range) {
                const range = req.headers.range;
                const parts = range.replace(/bytes=/, '').split('-');
                startByte = parseInt(parts[0], 10);
                endByte = parts[1] ? parseInt(parts[1], 10) : Math.min(
                    startByte + CHUNK_SIZE,
                    metadata.data.ContentLength - 1
                );;
            }

            const audioResponse = await getAudioFileInternal(fileName, startByte, endByte);
            if(audioResponse?.success){
                const chunk = endByte - startByte + 1;
                res.setHeader('Content-Type', 'audio/mpeg');
                res.setHeader('Content-Length', chunk);
                res.setHeader('Accept-Ranges', 'bytes');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader("Content-Range", `bytes ${startByte}-${endByte}/${metadata.data.ContentLength}`);
                res.status(206);

                const stream = new PassThrough();
                stream.end(audioResponse.data.Body);
                stream.pipe(res);
            }
            else{
                res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
                res.send({
                    message: audioResponse.message,
                    details: audioResponse.details
                });
            }

        }
        else{
            res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
            res.send({
                message: metadata.message,
                details: metadata.details
            });
        }
    }else{
        res.status(CONFIG.HTTP_CODE.BAD_REQUEST_ERROR);
        res.json({
            message: "BAD REQUEST ERROR, PLEASE VERIFY YOUR REQUEST AND ENSURE THAT ALL THE FIELDS ARE SETUP WELL !", 
            details: "fileName param should not be null or empty !"
        });
    }
}

let deleteAudio = async (req, res) => {
    let findAudioResult = await Audio.findOneAudioFromDBById(req.params.audioId);
    if(findAudioResult.success){
        if(findAudioResult.audio === null){
            res.status(CONFIG.HTTP_CODE.PAGE_NOT_FOUND_ERROR);
            res.json({
                message: "Couldn't delete audio !",
                details: "No audio with this _id has been found in the database !"
            });
        }else{
            let deleteResult = await Audio.deleteFromDB(req.params.audioId);
            if(deleteResult.success){
                let deleteAudioFileResult = await removeAudioFileInternal(findAudioResult.audio.uri);
                if(deleteAudioFileResult.success){
                    res.status(CONFIG.HTTP_CODE.OK);
                    res.json(deleteResult.data);
                }else{
                    res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
                    res.json({
                        message: deleteAudioFileResult.message,
                        details: "The audio has been deleted successfully from the database but couldn't delete the file from the server !"
                    });
                }
            }else{
                res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
                res.json({
                    message: deleteResult.message,
                    details: deleteResult.details
                });
            }
        }
    }else{
        res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json({
            message: findAudioResult.message,
            details: findAudioResult.details
        });
    } 
}


let updateAudio = async (req, res) => {
    let reqValidation = requestValidator.validateUpdateAudioRequest(req);
    if(reqValidation.success){
        let findAudioResult = await Audio.findOneAudioFromDBById(req.params.audioId);
        if(findAudioResult.success){
            if(findAudioResult.audio === null){
                res.status(CONFIG.HTTP_CODE.PAGE_NOT_FOUND_ERROR);
                res.json({
                    message: "Couldn't update audio !",
                    details: "No audio with this _id has been found in the database !"
                });
            }else{
                let theme = req.body.theme ? req.body.theme : findAudioResult.audio.theme;
                let author = req.body.author ? req.body.author : findAudioResult.audio.author;
                let description = req.body.description ? req.body.description : findAudioResult.audio.description;
                let keywords = req.body.keywords ? req.body.keywords : findAudioResult.audio.keywords;
                let date = req.body.date ? req.body.date : findAudioResult.audio.date;
                let audio = new Audio(findAudioResult.audio.uri, theme, author, description, keywords, date, findAudioResult.audio._id);
                let updateResult = await audio.updateToDB();
                if(updateResult.success){
                    res.status(CONFIG.HTTP_CODE.OK);
                    res.json(updateResult.data);
                }else{
                    res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
                    res.json({
                        message: updateResult.message,
                        details: updateResult.details
                    });
                }
            }
        }else{
            res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
            res.json({
                message: findAudioResult.message,
                details: findAudioResult.details
            });
        }
    }else{
        res.status(CONFIG.HTTP_CODE.BAD_REQUEST_ERROR);
        res.json({
            message: "BAD REQUEST ERROR, PLEASE VERIFY YOUR REQUEST AND ENSURE THAT ALL THE FIELDS ARE SETUP WELL !", 
            details: reqValidation.details
        });
    }
}

let getDistinctThemes = async (req, res) => {
    let themesResponse = await Audio.getDistinctThemes();
    sendResponse(res, themesResponse);
}

let getDistinctAuthors = async (req, res) => {
    let authorsResponse = await Audio.getDistinctAuthors();
    sendResponse(res, authorsResponse);
}

let sendResponse = (res, response) => {
    if(response.success){
        res.status(CONFIG.HTTP_CODE.OK);
        res.json(response.data);
    }else{
        res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json({
            message: response.message,
            details: response.details
        });
    }
}

let downloadAudioFile = async (req, res) => {
    try{
        const fileName = req.params.fileName;
        const audioResponse = await downloadAudioFileInternal(fileName);
        if(audioResponse?.success){
            const fileStream = audioResponse.data;
            res.attachment(fileName);
            fileStream.pipe(res);
        }
        else{
            console.log(audioResponse);
            res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
            res.send({
                message: audioResponse.message,
                details: audioResponse.details
            });
        }
    }catch(error){
        console.log(error);
        res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json({
            message: error,
            details: "ERROR WHILE DOWNLOADING AUDIO FILE !"
        });
    }
}

exports.postAudio = postAudio;
exports.getAudio = getAudio;
exports.getManyAudios = getManyAudios;
exports.getAudioFile = getAudioFile;
exports.deleteAudio = deleteAudio;
exports.updateAudio = updateAudio;
exports.getDistinctThemes = getDistinctThemes;
exports.getDistinctAuthors = getDistinctAuthors;
exports.downloadAudioFile = downloadAudioFile;