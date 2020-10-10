//let express = require("express");
let Audio = require("../model/Audio");
//let mongoose = require("mongoose");
//let DB = require("../model/db_crud");
const CONFIG = require("../config/server_config");
let requestValidator = require("./utils/request_validator");
let audioFileUploader = require("./utils/audio_file_uploader");
let audioUtils = require("./utils/audio_utils");
const rootDirPath = "../";

let postAudio = async (req, res) => {
    let reqValidation = requestValidator.validatePostAudioRequest(req);
    if(reqValidation.success){
        var audio = new Audio(req.body.uri, req.body.description, req.body.keywords, req.body.date, null);
        let result = await audio.saveToDB();
        if(result.success){
            let uploadResult = await audioFileUploader(req.files.audio, result.data._id+".mp3");
            if(uploadResult.success){
                audio.setUri(uploadResult.uri);
                let updateResult = await audio.updateToDB();
                console.log(updateResult);
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
        let matchAll = req.body.matchAll ? req.body.matchAll : false;
        console.log(matchAll)
        let findAudiosResults;
        if(matchAll) findAudiosResults = await Audio.findAudiosFromDBByKeywordsMatchAll(req.body.keywords, req.body.skip, req.body.limit);
        else findAudiosResults = await Audio.findAudiosFromDBByKeywordsMatchAny(req.body.keywords, req.body.skip, req.body.limit);
        if(findAudiosResults.success){
            if(findAudiosResults.audios === null){
                res.status(CONFIG.HTTP_CODE.PAGE_NOT_FOUND_ERROR);
                res.json({});
            }else{
                //faire ici le boucle de download du fichier
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
    res.sendFile(CONFIG.FILE_LOCATION.AUDIO_FILE_LOCATION+fileName, { root: __dirname+"/../" });
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
                let deleteAudioFileResult = await audioUtils.removeAudioFile(findAudioResult.audio.uri);
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
        let findAudioResult = await Audio.findOneAudioFromDBById(req.body._id);
        if(findAudioResult.success){
            if(findAudioResult.audio === null){
                res.status(CONFIG.HTTP_CODE.PAGE_NOT_FOUND_ERROR);
                res.json({
                    message: "Couldn't update audio !",
                    details: "No audio with this _id has been found in the database !"
                });
            }else{
                let audio = new Audio(findAudioResult.audio.uri, req.body.description, req.body.keywords, req.body.date, findAudioResult.audio._id);
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





exports.postAudio = postAudio;
exports.getAudio = getAudio;
exports.getManyAudios = getManyAudios;
exports.getAudioFile = getAudioFile;
exports.getAudioFile = getAudioFile;
exports.deleteAudio = deleteAudio;
exports.updateAudio = updateAudio;