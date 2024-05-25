import _ from 'lodash';
import moment from 'moment';
import { PassThrough } from 'stream';
import { Request, Response } from 'express';
import { DeleteResult } from 'mongodb';

import Audio, { IAudioLight, IAudioObject } from '../model/audio.model';
import { ErrorResponse, parseErrorInJson } from './utils/common';
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
import { UploadedFile } from 'express-fileupload';
import { IUpdateOne } from '../model/db-crud';
import { AuthenticatedAdminRequest } from '../model/admin.model';


export const postAudio = async (
    req: AuthenticatedAdminRequest<{}, {}, IAudioLight>, 
    res: Response<IAudioObject | ErrorResponse>): Promise<void> => {
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
            const date = req.body.date ? moment.utc(req.body.date, DATE_CONFIG.DEFAULT_FORMAT) : null;
            const audio = new Audio(req.body.uri, req.body.theme, req.body.author, req.body.description, req.body.keywords, date, null);
            const savedAudio = await audio.saveToDB();
            const uploadedAudioFile: UploadedFile = req.files.audio as UploadedFile;
            const splitedFileName = _.split(uploadedAudioFile.name, ".");
            const fileExtension = splitedFileName[splitedFileName.length-1];

            try{
                savedAudio.uri = await uploadAudioFileInternal(uploadedAudioFile.data, savedAudio.id+"."+fileExtension);
            }catch(exception: any){
                await savedAudio.deleteFromDB(); //deleteResult n'est pas encore utilisé ici parce que j'en ai pas encnore besoin
                throw exception;
            }

            await savedAudio.updateToDB();
            res.status(HTTP_CODE.OK);
            res.json(savedAudio);
        }
    }catch(exception: any){
        res.status(exception.httpCode ? exception.httpCode : HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}

export const getAudio = async (
    req: Request<{audioId: string}, {}, {}>, 
    res: Response<IAudioObject | ErrorResponse>): Promise<void> => {
    try{
        if(!req.params.audioId){
            res.status(HTTP_CODE.BAD_REQUEST_ERROR);
            res.json({
                success: false,
                reason: "No audio id found !",
                message: "Utilisateur introuvable.", 
                details: "audio id is null."
            });
        } else {
            const foundAudio = await Audio.findOneAudioFromDBById(req.params.audioId);
            if(!foundAudio){
                res.status(HTTP_CODE.OK);
                res.json(null);
            }else{
                res.status(HTTP_CODE.OK);
                res.json(foundAudio);
            }
        }
    }catch(exception: any){
        res.status(exception.httpCode ? exception.httpCode : HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}

export const getManyAudios = async(
    req: Request<{}, {}, {}, {
        skip?: number, 
        limit?: number, 
        minDate?: string, 
        maxDate?: string, 
        theme?: string, 
        author?: string, 
        keywords?: string}>, 
    res: Response<IAudioObject[] | ErrorResponse>): Promise<void> => {
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
            const skip = req.query.skip ? req.query.skip : AUDIO_GET_PARAMS.DEFAULT_SKIP_NUMBER;
            const limit = req.query.limit ? req.query.limit : AUDIO_GET_PARAMS.DEFAULT_LIMIT_NUMBER;
            const minDate = req.query.minDate ? moment.utc(req.query.minDate, DATE_CONFIG.DEFAULT_FORMAT) : null;
            const maxDate = req.query.maxDate ? moment.utc(req.query.maxDate, DATE_CONFIG.DEFAULT_FORMAT) : null;
            const findAudiosResults = await Audio.findAudiosFromDB(req.query.theme, req.query.author, req.query.keywords, minDate, maxDate, skip, limit);
            if(!findAudiosResults){
                res.status(HTTP_CODE.OK);
                res.json([]);
            }else{
                res.status(HTTP_CODE.OK);
                res.json(findAudiosResults);
            }
        }
    }catch(exception: any){
        res.status(exception.httpCode ? exception.httpCode : HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}

export const getAudioFile = async (
    req: Request<{fileName: string}, {}, {}>, 
    res: Response<Buffer | ErrorResponse>): Promise<void> => {
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
            let endByte = metadata.ContentLength - 1;
            if (req.headers?.range) {
                const range = req.headers.range;
                const parts = range.replace(/bytes=/, '').split('-');
                startByte = parseInt(parts[0], 10);
                endByte = parts[1] ? parseInt(parts[1], 10) : Math.min(
                    startByte + CHUNK_SIZE,
                    metadata.ContentLength - 1
                );;
            }
            const audioByteData = await getAudioFileInternal(fileName, startByte, endByte);
            const chunk = endByte - startByte + 1;
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Content-Length', chunk);
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader("Content-Range", `bytes ${startByte}-${endByte}/${metadata.ContentLength}`);
            res.status(206);
            const stream = new PassThrough();
            stream.end(audioByteData);
            stream.pipe(res);
        }
    }catch(exception: any){
        res.status(exception.httpCode ? exception.httpCode : HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}

export const deleteAudio = async (
    req: AuthenticatedAdminRequest<{audioId: string}, {}, {}, {}>, 
    res: Response<DeleteResult | ErrorResponse>
): Promise<void> => {
    try{
        const foundAudio = await Audio.findOneAudioFromDBById(req.params.audioId);
        if(!foundAudio){
            res.status(HTTP_CODE.PAGE_NOT_FOUND_ERROR);
            res.json({
                success: false,
                reason: "No audio with this id found !",
                message: "Audio introuvable.", 
                details: "Audio doesn't exist."
            });
        }else{
            const deleteAudioResult = await Audio.deleteFromDB(req.params.audioId);
            await removeAudioFileInternal(foundAudio.uri);
            res.status(HTTP_CODE.OK);
            res.json(deleteAudioResult);
        }
    }catch(exception: any){
        res.status(exception.httpCode ? exception.httpCode : HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}


export const updateAudio = async (
    req: AuthenticatedAdminRequest<{audioId: string}, {}, IAudioLight>, 
    res: Response<IUpdateOne | ErrorResponse>): Promise<void> => {
    try{
        const reqValidation = validateUpdateAudioRequest(req);
        if(!reqValidation.success){
            res.status(HTTP_CODE.BAD_REQUEST_ERROR);
            res.json({
                success: false,
                reason: "Fields validation error !",
                message: "Données invalides. Veuillez renseigner correctement tous les champs !",
                details: reqValidation.details
            });
        } else {
            let foundAudio = await Audio.findOneAudioFromDBById(req.params.audioId);
            if(!foundAudio){
                res.status(HTTP_CODE.PAGE_NOT_FOUND_ERROR);
                res.json({
                    success: false,
                    reason: "No audio with this id found !",
                    message: "Audio introuvable.", 
                    details: "No audio found for update"
                });
            }else{
                const theme = req.body.theme ? req.body.theme : foundAudio.theme;
                const author = req.body.author ? req.body.author : foundAudio.author;
                const description = req.body.description ? req.body.description : foundAudio.description;
                const keywords = req.body.keywords ? req.body.keywords : foundAudio.keywords;
                const date = req.body.date ? req.body.date : foundAudio.date;
                const audio = new Audio(foundAudio.uri, theme, author, description, keywords, moment.utc(date, DATE_CONFIG.DEFAULT_FORMAT), foundAudio.id);
                const updateResult = await audio.updateToDB();
                res.status(HTTP_CODE.OK);
                res.json(updateResult);
            }
        }
    }catch(exception: any){
        res.status(exception.httpCode ? exception.httpCode : HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}

export const getDistinctThemes = async (
    _req: Request<{}, {}, {}>, 
    res: Response<string[] | ErrorResponse>): Promise<void> => {
    try{
        const themesResponse = await Audio.getDistinctThemes();
        res.status(HTTP_CODE.OK);
        res.json(themesResponse);
    }catch(exception: any){
        res.status(exception.httpCode ? exception.httpCode : HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}

export const getDistinctAuthors = async (
    _req: Request<{}, {}, {}>, 
    res: Response<string[] | ErrorResponse>): Promise<void> => {
    try{
        const authorsResponse = await Audio.getDistinctAuthors();
        res.status(HTTP_CODE.OK);
        res.json(authorsResponse);
    }catch(exception: any){
        res.status(exception.httpCode ? exception.httpCode : HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}

export const downloadAudioFile = async (
    req: Request<{fileName: string}, {}, {}>, 
    res: Response<Buffer | ErrorResponse>): Promise<void> => {
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
            const fileStream = await downloadAudioFileInternal(fileName);
            res.attachment(fileName);
            fileStream.pipe(res);
        }
    }catch(exception: any){
        res.status(exception.httpCode ? exception.httpCode : HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}

export const downloadAll = async (
    _req: AuthenticatedAdminRequest<{}, {}, {}>, 
    res: Response<Buffer | ErrorResponse>): Promise<void> => {
    try{
        const zipStream = await downloadAudioBucket();
        // const fileStream = audioResponse.data;
        // res.attachment(`Audio_backup_${new Date()}.zip`);
        // Set response headers for zip file    
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename=Backup_audios_du_${moment.utc().startOf("second").format("YYYYMMDD_HHmmss")}.zip`);
        zipStream.pipe(res);
    }catch(exception: any){
        res.status(exception.httpCode ? exception.httpCode : HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}