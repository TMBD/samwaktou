const { PassThrough } = require('stream');
const CONFIG = require("./../../../config/server.config");

let s3;

const AWS = require('aws-sdk');
const credentials = new AWS.Credentials({
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
});

if(process.env.PROFILE === "prod"){
    s3 = new AWS.S3({
        region: "us-east-2",
        credentials: credentials
    });
} else if (process.env.PROFILE === "dev"){
    s3 = new AWS.S3({
        region: "us-east-2",
        credentials: credentials,
        endpoint: "http://127.0.0.1:9000",
        s3ForcePathStyle: true
    });
}

const uploadAudioFileToS3Bucket = async (file, audioFileName) => {

    return await s3.putObject({
        Bucket: process.env.S3_ACCESS_POINT_ARN,
        Key: audioFileName,
        Body: file.data
    }).promise()
    .then(
        (data) => {
            return Promise.resolve({ 
                success: true,
                uri: audioFileName
            })
        },
        (error) => {
            return Promise.reject({ 
                success: false,
                reason: "Couldn't upload the audio file in s3 bucket",
                message: "Une erreur s'est produite lors du chargement du fichier audio.",
                details: error,
                httpCode: CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR
            });
        }
    );
}

const getAudioFileFromS3Bucket = async (audioFileName, startByte, endByte) => {
    paramRange = `bytes=${startByte}-${endByte}`;
    return await s3.getObject({
        Bucket: process.env.S3_ACCESS_POINT_ARN,
        Key: audioFileName,
        Range: paramRange
    }).promise()
    .then(
        (data) => {
            return Promise.resolve({ 
                success: true,
                data: data
            })
        },
        (error) => {
            return Promise.reject({ 
                success: false,
                reason: "Couldn't get audio file from s3 bucket",
                message: "Une erreur s'est produite lors de la récupération du fichier audio.",
                details: error,
                httpCode: CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR
            });
        }
    );
}

const getAudioFileMetadataFromS3Bucket = async (audioFileName) => {
    return await s3.headObject({
        Bucket: process.env.S3_ACCESS_POINT_ARN,
        Key: audioFileName,
    }).promise()
    .then(
        (data) => {
            return Promise.resolve({ 
                success: true,
                data: data
            })
        },
        (error) => {
            return Promise.reject({ 
                success: false,
                reason: "Couldn't get audio file metadata from s3 bucket",
                message: "Une erreur s'est produite lors de la lecture des informations du fichier audio.",
                details: error,
                httpCode: CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR
            });
        }
    );
}

const removeAudioFileFromS3Bucket = async (audioFileName) => {
    return await s3.deleteObject({
        Bucket: process.env.S3_ACCESS_POINT_ARN,
        Key: audioFileName,
    }).promise()
    .then(
        (data) => {
            return Promise.resolve({ 
                success: true,
                data: data
            })
        },
        (error) => {
            return Promise.reject({ 
                success: false,
                reason: "Couldn't delete audio file from s3 bucket",
                message: "Une erreur s'est produite lors de la suppression du fichier audio.",
                details: error,
                httpCode: CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR
            });
        }
    );
}

const downloadAudioFileFromS3Bucket = async (audioFileName) => {
    return await s3.getObject({
        Bucket: process.env.S3_ACCESS_POINT_ARN,
        Key: audioFileName,
    }).promise()
    .then(
        (data) => {
            const stream = new PassThrough();
            stream.end(data.Body);
            return Promise.resolve({
                success: true,
                data: stream
            })
        },
        (error) => {
            return Promise.reject({ 
                success: false,
                reason: "Couldn't download audio file from s3 bucket",
                message: "Une erreur s'est produite lors du téléchargement du fichier audio.",
                details: error,
                httpCode: CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR
            });
        }
    );
}

module.exports = {uploadAudioFileToS3Bucket, getAudioFileFromS3Bucket, getAudioFileMetadataFromS3Bucket, removeAudioFileFromS3Bucket, downloadAudioFileFromS3Bucket};