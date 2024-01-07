const AWS = require('aws-sdk');
const { PassThrough } = require('stream');

const credentials = new AWS.Credentials({
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
})

const s3 = new AWS.S3({
    region: "us-east-2",
    credentials: credentials
});

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
            return Promise.resolve({ 
                success: false,
                message: error,
                details: "Couldn't upload the audio file in s3 bucket"
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
            return Promise.resolve({ 
                success: false,
                message: error,
                details: "Couldn't get audio file from s3 bucket"
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
            return Promise.resolve({ 
                success: false,
                message: error,
                details: "Couldn't get audio file metadata from s3 bucket"
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
            return Promise.resolve({ 
                success: false,
                message: error,
                details: "Couldn't delete audio file from s3 bucket"
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
            return Promise.resolve({ 
                success: false,
                message: error,
                details: "Couldn't download audio file from s3 bucket"
            });
        }
    );
}

module.exports = {uploadAudioFileToS3Bucket, getAudioFileFromS3Bucket, getAudioFileMetadataFromS3Bucket, removeAudioFileFromS3Bucket, downloadAudioFileFromS3Bucket};