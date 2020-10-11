let bcryptejs = require("bcryptjs");
let Audio = require("../model/Admin");
const CONFIG = require("../config/server_config");
let requestValidator = require("./utils/admin/admin_request_validator");
const Admin = require("../model/Admin");
// let audioUtils = require("./utils/admin_utils");

let postAdmin = async (req, res) => {
    let reqValidation = requestValidator.validatePostAdminRequest(req.body);
    if(!reqValidation.error){
        const foundAdmin = await Admin.findOneAdminFromDBByEmail(req.body.email);
        if(foundAdmin.success){
            if(foundAdmin.admin === null){
                const salt = await bcryptejs.genSalt(10);
                const hashedPassword = await bcryptejs.hash(req.body.password, salt);
                let admin = new Admin(req.body.surname, req.body.name, req.body.email, hashedPassword, undefined, null);
                let result = await admin.saveToDB();
                if(result.success){
                    res.status(CONFIG.HTTP_CODE.OK);
                    res.json({
                        _id: result.data._id,
                        surname: result.data.surname,
                        name: result.data.name,
                        email: result.data.email,
                        date: result.data.date
                    });
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
                    message: "A user with this email alrady exist !"
                });
            }
        }else{
            res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
            res.json({
                message: foundAdmin.message,
                details: "An error has occured while trying to verify if the user with this email exists or not !"
            });
        }
    }else{
        res.status(CONFIG.HTTP_CODE.BAD_REQUEST_ERROR);
        res.json(reqValidation.error.details);
    }
}

// let getAudio = async (req, res) => {
//     if(req.params.audioId){
//         let findAudioResult = await Audio.findOneAudioFromDBById(req.params.audioId);
//         if(findAudioResult.success){
//             if(findAudioResult.audio === null){
//                 res.status(CONFIG.HTTP_CODE.PAGE_NOT_FOUND_ERROR);
//                 res.json({});
//             }else{
//                 res.status(CONFIG.HTTP_CODE.OK);
//                 res.json(findAudioResult.audio);
//             }
            
//         }
//         else{
//             res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
//             res.json({
//                 message: findAudioResult.message,
//                 details: findAudioResult.details
//             });
//         }

//     }else{
//         res.status(CONFIG.HTTP_CODE.BAD_REQUEST_ERROR);
//         res.json({
//             message: "BAD REQUEST ERROR, PLEASE VERIFY YOUR REQUEST AND ENSURE THAT ALL THE FIELDS ARE SETUP WELL !", 
//             details: "No audio id found"
//         });
//     }

// }

// let getManyAudios = async(req, res) => {

//     let reqValidation = requestValidator.validateGetAudioRequest(req);
//     if(reqValidation.success){
//         let matchAll = req.body.matchAll ? req.body.matchAll : false;
//         console.log(matchAll)
//         let findAudiosResults;
//         if(matchAll) findAudiosResults = await Audio.findAudiosFromDBByKeywordsMatchAll(req.body.keywords, req.body.skip, req.body.limit);
//         else findAudiosResults = await Audio.findAudiosFromDBByKeywordsMatchAny(req.body.keywords, req.body.skip, req.body.limit);
//         if(findAudiosResults.success){
//             if(findAudiosResults.audios === null){
//                 res.status(CONFIG.HTTP_CODE.PAGE_NOT_FOUND_ERROR);
//                 res.json({});
//             }else{
//                 //faire ici le boucle de download du fichier
//                 res.status(CONFIG.HTTP_CODE.OK);
//                 res.json(findAudiosResults.audios);
//             }
            

//         }else{
//             res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
//             res.json({
//                 message: findAudiosResults.message,
//                 details: findAudiosResults.details
//             });
//         }
//     }else{
//         res.status(CONFIG.HTTP_CODE.BAD_REQUEST_ERROR);
//         res.json({
//             message: "BAD REQUEST ERROR, PLEASE VERIFY YOUR REQUEST AND ENSURE THAT ALL THE FIELDS ARE SETUP WELL !", 
//             details: reqValidation.details
//         });
//     }
    
// }

// let getAudioFile = async (req, res) => {
//     let fileName = req.params.fileName;
//     res.sendFile(CONFIG.FILE_LOCATION.AUDIO_FILE_LOCATION+fileName, { root: __dirname+"/../" });
// }

// let deleteAudio = async (req, res) => {
//     let findAudioResult = await Audio.findOneAudioFromDBById(req.params.audioId);
//     if(findAudioResult.success){
//         if(findAudioResult.audio === null){
//             res.status(CONFIG.HTTP_CODE.PAGE_NOT_FOUND_ERROR);
//             res.json({
//                 message: "Couldn't delete audio !",
//                 details: "No audio with this _id has been found in the database !"
//             });
//         }else{
//             let deleteResult = await Audio.deleteFromDB(req.params.audioId);
//             if(deleteResult.success){
//                 let deleteAudioFileResult = await audioUtils.removeAudioFile(findAudioResult.audio.uri);
//                 if(deleteAudioFileResult.success){
//                     res.status(CONFIG.HTTP_CODE.OK);
//                     res.json(deleteResult.data);
//                 }else{
//                     res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
//                     res.json({
//                         message: deleteAudioFileResult.message,
//                         details: "The audio has been deleted successfully from the database but couldn't delete the file from the server !"
//                     });
//                 }
//             }else{
//                 res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
//                 res.json({
//                     message: deleteResult.message,
//                     details: deleteResult.details
//                 });
//             }
//         }
//     }else{
//         res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
//         res.json({
//             message: findAudioResult.message,
//             details: findAudioResult.details
//         });
//     } 
// }


// let updateAudio = async (req, res) => {
//     let reqValidation = requestValidator.validateUpdateAudioRequest(req);
//     if(reqValidation.success){
//         let findAudioResult = await Audio.findOneAudioFromDBById(req.body._id);
//         if(findAudioResult.success){
//             if(findAudioResult.audio === null){
//                 res.status(CONFIG.HTTP_CODE.PAGE_NOT_FOUND_ERROR);
//                 res.json({
//                     message: "Couldn't update audio !",
//                     details: "No audio with this _id has been found in the database !"
//                 });
//             }else{
//                 let audio = new Audio(findAudioResult.audio.uri, req.body.description, req.body.keywords, req.body.date, findAudioResult.audio._id);
//                 let updateResult = await audio.updateToDB();
//                 if(updateResult.success){
//                     res.status(CONFIG.HTTP_CODE.OK);
//                     res.json(updateResult.data);
//                 }else{
//                     res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
//                     res.json({
//                         message: updateResult.message,
//                         details: updateResult.details
//                     });
//                 }
//             }
//         }else{
//             res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
//             res.json({
//                 message: findAudioResult.message,
//                 details: findAudioResult.details
//             });
//         }
//     }else{
//         res.status(CONFIG.HTTP_CODE.BAD_REQUEST_ERROR);
//         res.json({
//             message: "BAD REQUEST ERROR, PLEASE VERIFY YOUR REQUEST AND ENSURE THAT ALL THE FIELDS ARE SETUP WELL !", 
//             details: reqValidation.details
//         });
//     }
// }





exports.postAdmin = postAdmin;
// exports.getAudio = getAudio;
// exports.getManyAudios = getManyAudios;
// exports.getAudioFile = getAudioFile;
// exports.getAudioFile = getAudioFile;
// exports.deleteAudio = deleteAudio;
// exports.updateAudio = updateAudio;