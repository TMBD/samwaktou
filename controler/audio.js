//let express = require("express");
let Audio = require("../model/Audio");
//let mongoose = require("mongoose");
//let DB = require("../model/db_crud");
const config = require("../config/server_config");
let requestValidator = require("./utils/request_validator");
let audioFileUploader = require("./utils/audio_file_uploader");
const rootDirPath = "../";

let postAudio = (req, res) => {
    let reqValidation = requestValidator.validatePostAudioRequest(req);
    if(reqValidation.success){
        var audio = new Audio(req.body.uri, req.body.description, req.body.keywords, req.body.date);
        audio.saveToDB(async(result) => {
            if(result.success){
                let uploadResult = await audioFileUploader(req.body.file, result.data._id);
                if(uploadResult.success){
                    let audioUri = rootDirPath+config.FILE_LOCATION.AUDIO_FILE_LOCATION+result.data._id;
                    audio.setUri(audioUri);
                    let updateResult = await audio.updateToDB();
                    if(updateResult.success){
                        result.data.uri = audio.uri;
                        res.status(config.HTTP_CODE.OK);
                        res.json(result.data);
                    }else{
                        //Reflechire plutard sur cette partie pour voir si je vais supprimer de nouveau le fichier dans le serveur 
                        //et l'enregistrement correspondant dans la base de données...
                        res.status(config.HTTP_CODE.INTERNAL_SERVER_ERROR);
                        res.json({
                            message: updateResult.message,
                            details: "An error has occure while trying to update the file uri in the database after it has been saved in the sever !"
                        });
                    }
                    

                }else{
                    let deleteResult = await audio.deleteFromDB(); //deleteResult n'est pas encore utilisé ici parce que j'en ai pas encnore besoin
                    res.status(config.HTTP_CODE.INTERNAL_SERVER_ERROR);
                    res.json({
                        message: uploadResult.message,
                        details: uploadResult.details
                    });
                }
            }else{
                res.status(config.HTTP_CODE.INTERNAL_SERVER_ERROR);
                res.json({
                    message: result.message,
                    details: result.details
                });
            }
        });
        

    }else{
        res.status(config.HTTP_CODE.BAD_REQUEST_ERROR);
        res.json({
            message: "BAD REQUEST ERROR, PLEASE VERIFY YOUR REQUEST AND ENSURE THAT ALL THE FIELDS ARE SETUP WELL !", 
            details: reqValidation.details
        });
    }
    
}





exports.postAudio = postAudio;