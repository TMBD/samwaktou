import _ from 'lodash';
import moment from 'moment';
import { PassThrough } from 'stream';

import Audio from '../model/audio.model';
import { parseErrorInJson } from './utils/utilities';
import { HTTP_CODE, AUDIO_GET_PARAMS, DATE_CONFIG } from '../config/server.config';
import { 
    validatePostAudioRequest, 
    validateGetAudioRequest, 
    validateUpdateAudioRequest 
} from './utils/audio/audio-request-validator';
import {
    uploadAudioFileInternal, 
    getAudioFileInternal, 
    getAudioFileMetadataInternal, 
    removeAudioFileInternal, 
    downloadAudioFileInternal, 
    downloadAudioBucket
} from './utils/audio/audio-file-handler';


export const postAudio = async (req, res) => {
    try{
        let reqValidation = validatePostAudioRequest(req);
        if(!reqValidation.success){
            res.status(HTTP_CODE.BAD_REQUEST_ERROR);
            res.json({
                success: false,
                reason: "Fields validation error !",
                message: "Données invalides. Veuillez renseigner correctement tous les champs !",
                details: reqValidation.details
            });
        } else {
            var audio = new Audio(req.body.uri, req.body.theme, req.body.author, req.body.description, req.body.keywords, moment.utc(req.body.date, DATE_CONFIG.DEFAULT_FORMAT), null);
            let result = await audio.saveToDB();
            const splitedFileName = _.split(req.files.audio.name, ".");
            const fileExtension = splitedFileName[splitedFileName.length-1];

            let uploadResult;
            try{
                uploadResult = await uploadAudioFileInternal(req.files.audio, result.data._id+"."+fileExtension);
            }catch(exception){
                let deleteResult = await audio.deleteFromDB(); //deleteResult n'est pas encore utilisé ici parce que j'en ai pas encnore besoin
                throw exception;
            }
            audio.setUri(uploadResult.uri);
            let updateResult = await audio.updateToDB();
            result.data.uri = audio.getUri();
            res.status(HTTP_CODE.OK);
            res.json(result.data);
        }
    }catch(exception){
        res.status(exception.httpCode ? exception.httpCode : HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}

export const getAudio = async (req, res) => {
    try{
        if(!req.params.audioId){
            res.status(HTTP_CODE.BAD_REQUEST_ERROR);
            res.json({
                sucess: false,
                reason: "No audio id found !",
                message: "Utilisateur introuvable.", 
                details: "audio id is null."
            });
        } else {
            let findAudioResult = await Audio.findOneAudioFromDBById(req.params.audioId);
            if(!findAudioResult.audio){
                res.status(HTTP_CODE.OK);
                res.json({});
            }else{
                res.status(HTTP_CODE.OK);
                res.json(findAudioResult.audio);
            }
        }
    }catch(exception){
        res.status(exception.httpCode ? exception.httpCode : HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}

export const getManyAudios = async(req, res) => {
    try{
        let reqValidation = validateGetAudioRequest(req);
        if(!reqValidation.success){
            res.status(HTTP_CODE.BAD_REQUEST_ERROR);
            res.json({
                success: false,
                reason: "Fields validation error !",
                message: "Données invalides. Veuillez renseigner correctement tous les champs !",
                details: reqValidation.details
            });
        } else {
            let skip = req.query.skip ? parseInt(req.query.skip, 10) : AUDIO_GET_PARAMS.DEFAULT_SKIP_NUMBER;
            let limit = req.query.limit ? parseInt(req.query.limit, 10) : AUDIO_GET_PARAMS.DEFAULT_LIMIT_NUMBER;
            let findAudiosResults;
            findAudiosResults = await Audio.findAudiosFromDB(req.query.theme, req.query.author, req.query.keywords, req.query.minDate, req.query.maxDate, skip, limit);
            if(!findAudiosResults.audios){
                res.status(HTTP_CODE.OK);
                res.json([]);
            }else{
                res.status(HTTP_CODE.OK);
                res.json(findAudiosResults.audios);
            }
        }
    }catch(exception){
        res.status(exception.httpCode ? exception.httpCode : HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}

export const getAudioFile = async (req, res) => {
    try{
        let fileName = req.params.fileName;
        if(!fileName){
            res.status(HTTP_CODE.BAD_REQUEST_ERROR);
            res.json({
                success: false,
                reason: "Fields validation error !",
                message: "Données invalides. Veuillez renseigner correctement tous les champs !",
                details: "fileName param should not be null or empty !"
            });
        } else {
            const CHUNK_SIZE = 500000; // ~500KB
            const metadata = await getAudioFileMetadataInternal(fileName);
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
    }catch(exception){
        res.status(exception.httpCode ? exception.httpCode : HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}

export const deleteAudio = async (req, res) => {
    try{
        let findAudioResult = await Audio.findOneAudioFromDBById(req.params.audioId);
        if(!findAudioResult.audio){
            res.status(HTTP_CODE.PAGE_NOT_FOUND_ERROR);
            res.json({
                sucess: false,
                reason: "No audio with this id found !",
                message: "Audio introuvable.", 
                details: "Audio doesn't exist."
            });
        }else{
            let deleteResult = await Audio.deleteFromDB(req.params.audioId);
            let deleteAudioFileResult = await removeAudioFileInternal(findAudioResult.audio.uri);
            res.status(HTTP_CODE.OK);
            res.json(deleteResult.data);
        }
    }catch(exception){
        res.status(exception.httpCode ? exception.httpCode : HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}


export const updateAudio = async (req, res) => {
    try{
        let reqValidation = validateUpdateAudioRequest(req);
        if(!reqValidation.success){
            res.status(HTTP_CODE.BAD_REQUEST_ERROR);
            res.json({
                success: false,
                reason: "Fields validation error !",
                message: "Données invalides. Veuillez renseigner correctement tous les champs !",
                details: reqValidation.details
            });
        } else {
            let findAudioResult = await Audio.findOneAudioFromDBById(req.params.audioId);
            if(!findAudioResult.audio){
                res.status(HTTP_CODE.PAGE_NOT_FOUND_ERROR);
                res.json({
                    sucess: false,
                    reason: "No audio with this id found !",
                    message: "Audio introuvable.", 
                    details: "No audio found for update"
                });
            }else{
                let theme = req.body.theme ? req.body.theme : findAudioResult.audio.theme;
                let author = req.body.author ? req.body.author : findAudioResult.audio.author;
                let description = req.body.description ? req.body.description : findAudioResult.audio.description;
                let keywords = req.body.keywords ? req.body.keywords : findAudioResult.audio.keywords;
                let date = req.body.date ? req.body.date : findAudioResult.audio.date;
                let audio = new Audio(findAudioResult.audio.uri, theme, author, description, keywords, moment.utc(date, DATE_CONFIG.DEFAULT_FORMAT), findAudioResult.audio._id);
                let updateResult = await audio.updateToDB();
                res.status(HTTP_CODE.OK);
                res.json(updateResult.data);
            }
        }
    }catch(exception){
        res.status(exception.httpCode ? exception.httpCode : HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}

export const getDistinctThemes = async (req, res) => {
    try{
        let themesResponse = await Audio.getDistinctThemes();
        res.status(HTTP_CODE.OK);
        res.json(themesResponse.data);
    }catch(exception){
        res.status(exception.httpCode ? exception.httpCode : HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}

export const getDistinctAuthors = async (req, res) => {
    try{
        let authorsResponse = await Audio.getDistinctAuthors();
        res.status(HTTP_CODE.OK);
        res.json(authorsResponse.data);
    }catch(exception){
        res.status(exception.httpCode ? exception.httpCode : HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}

export const downloadAudioFile = async (req, res) => {
    try{
        const fileName = req.params.fileName;
        if(!fileName){
            res.status(HTTP_CODE.BAD_REQUEST_ERROR);
            res.json({
                success: false,
                reason: "Fields validation error !",
                message: "Données invalides. Veuillez renseigner correctement tous les champs !",
                details: "fileName param should not be null or empty !"
            });
        }else {
            const audioResponse = await downloadAudioFileInternal(fileName);
            const fileStream = audioResponse.data;
            res.attachment(fileName);
            fileStream.pipe(res);
        }
    }catch(exception){
        res.status(exception.httpCode ? exception.httpCode : HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}

export const downloadAll = async (req, res) => {
    try{
        const zipStream = await downloadAudioBucket();
        // const fileStream = audioResponse.data;
        // res.attachment(`Audio_backup_${new Date()}.zip`);
        // Set response headers for zip file
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename=Backup_audios_du_${moment.utc().startOf("second").format("YYYYMMDD_HHmmss")}.zip`);
        zipStream.pipe(res);
    }catch(exception){
        res.status(exception.httpCode ? exception.httpCode : HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}