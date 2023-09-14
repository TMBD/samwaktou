let {uploadAudioFileToS3Bucket, getAudioFileFromS3Bucket, getAudioFileMetadataFromS3Bucket, removeAudioFileFromS3Bucket, downloadAudioFileFromS3Bucket} = require("./s3_audio_file_uploader");
let {uploadAudioFileInLocal, getAudioFileFromLocal, getAudioFileMetadataFromLocal, removeAudioFileFromLocal, downloadAudioFileFromLocal} = require("./local_audio_file_uploader");

const uploadAudioFileInternal = async (file, audioFileName) => {
    if(process.env.PROFILE === "prod") return await uploadAudioFileToS3Bucket(file, audioFileName);
    else if(process.env.PROFILE === "dev") return await uploadAudioFileInLocal(file, audioFileName);
    else return Promise.resolve({ 
        success: false,
        message: "Unable to upload audio file in the server !",
        details: "Profile "+process.env.PROFILE+" not found !",
    });
}

const getAudioFileInternal = async (audioFileName, startByte, endByte) => {
    if(process.env.PROFILE === "prod") return await getAudioFileFromS3Bucket(audioFileName, startByte, endByte);
    else if(process.env.PROFILE === "dev") return await getAudioFileFromLocal(audioFileName, startByte, endByte);
    else return Promise.resolve({
        success: false,
        message: "Unable to get audio file from the server !",
        details: "Profile "+process.env.PROFILE+" not found !",
    });
}

const getAudioFileMetadataInternal = async (audioFileName) => {
    if(process.env.PROFILE === "prod") return await getAudioFileMetadataFromS3Bucket(audioFileName);
    else if(process.env.PROFILE === "dev") return await getAudioFileMetadataFromLocal(audioFileName);
    else return Promise.resolve({
        success: false,
        message: "Unable to get audio file metadata from the server !",
        details: "Profile "+process.env.PROFILE+" not found !",
    });
}

const removeAudioFileInternal = async (audioFileName) => {
    if(process.env.PROFILE === "prod") return await removeAudioFileFromS3Bucket(audioFileName);
    else if(process.env.PROFILE === "dev") return await removeAudioFileFromLocal(audioFileName);
    else return Promise.resolve({
        success: false,
        message: "Unable to delete audio file from the server !",
        details: "Profile "+process.env.PROFILE+" not found !",
    });
}

const downloadAudioFileInternal = async (audioFileName) => {
    if(process.env.PROFILE === "prod") return await downloadAudioFileFromS3Bucket(audioFileName);
    else if(process.env.PROFILE === "dev") return await downloadAudioFileFromLocal(audioFileName);
    else return Promise.resolve({
        success: false,
        message: "Unable to download audio file from the server !",
        details: "Profile "+process.env.PROFILE+" not found !",
    });
}

module.exports = {uploadAudioFileInternal, getAudioFileInternal, getAudioFileMetadataInternal, removeAudioFileInternal, downloadAudioFileInternal};








