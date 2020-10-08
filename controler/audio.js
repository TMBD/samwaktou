//let express = require("express");
let Audio = require("../model/Audio");
//let mongoose = require("mongoose");
//let DB = require("../model/db_crud");
const CONFIG = require("../config/server_config");
let requestValidator = require("./utils/request_validator");
let audioFileUploader = require("./utils/audio_file_uploader");
const rootDirPath = "../";

let postAudio = async (req, res) => {
    let reqValidation = requestValidator.validatePostAudioRequest(req);
    if(reqValidation.success){
        var audio = new Audio(req.body.uri, req.body.description, req.body.keywords, req.body.date);
        let result = await audio.saveToDB();
        if(result.success){
            let uploadResult;
            try{
                uploadResult = await audioFileUploader(req.files.audio, result.data._id+".mp3");
            }catch(fileUploadError){
                let deleteResult = await audio.deleteFromDB(); //deleteResult n'est pas encore utilisé ici parce que j'en ai pas encnore besoin
                res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
                res.json({
                    message: fileUploadError,
                    details: "Couldn't save the file in the server"
                });
            }

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





exports.postAudio = postAudio;