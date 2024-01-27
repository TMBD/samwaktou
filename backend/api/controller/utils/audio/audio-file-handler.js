let {
    uploadAudioFileToS3Bucket, 
    getAudioFileFromS3Bucket, 
    getAudioFileMetadataFromS3Bucket, 
    removeAudioFileFromS3Bucket, 
    downloadAudioFileFromS3Bucket
} = require("./s3-audio-file-uploader");

const uploadAudioFileInternal = async (file, audioFileName) => {
    return await uploadAudioFileToS3Bucket(file, audioFileName);
}

const getAudioFileInternal = async (audioFileName, startByte, endByte) => {
    return await getAudioFileFromS3Bucket(audioFileName, startByte, endByte);
}

const getAudioFileMetadataInternal = async (audioFileName) => {
    return await getAudioFileMetadataFromS3Bucket(audioFileName);
}

const removeAudioFileInternal = async (audioFileName) => {
    return await removeAudioFileFromS3Bucket(audioFileName);
}

const downloadAudioFileInternal = async (audioFileName) => {
    return await downloadAudioFileFromS3Bucket(audioFileName);
}

module.exports = {uploadAudioFileInternal, getAudioFileInternal, getAudioFileMetadataInternal, removeAudioFileInternal, downloadAudioFileInternal};








