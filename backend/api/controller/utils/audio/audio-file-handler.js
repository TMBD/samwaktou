let {
    uploadAudioFileToS3Bucket, 
    getAudioFileFromS3Bucket, 
    getAudioFileMetadataFromS3Bucket, 
    removeAudioFileFromS3Bucket, 
    downloadAudioFileFromS3Bucket
} = require("./s3-audio-file-uploader");
let {
    uploadAudioFileInLocal, 
    getAudioFileFromLocal, 
    getAudioFileMetadataFromLocal, 
    removeAudioFileFromLocal, 
    downloadAudioFileFromLocal
} = require("./local-audio-file-uploader");

const uploadAudioFileInternal = async (file, audioFileName) => {
    if(process.env.PROFILE === "prod") return await uploadAudioFileToS3Bucket(file, audioFileName);
    else if(process.env.PROFILE === "dev") return await uploadAudioFileInLocal(file, audioFileName);
    else return Promise.reject({
        success: false,
        reason: "Unable to upload audio file in the server !",
        message: "Une erreur s'est produite lors du chargement du fichier audio.",
        details: "Profile "+process.env.PROFILE+" not found !",
        httpCode: CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR
    });
}

const getAudioFileInternal = async (audioFileName, startByte, endByte) => {
    if(process.env.PROFILE === "prod") return await getAudioFileFromS3Bucket(audioFileName, startByte, endByte);
    else if(process.env.PROFILE === "dev") return await getAudioFileFromLocal(audioFileName, startByte, endByte);
    else return Promise.reject({
        success: false,
        reason: "Unable to get audio file from the server !",
        message: "Une erreur s'est produite lors de la récupération du fichier audio.",
        details: "Profile "+process.env.PROFILE+" not found !",
        httpCode: CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR
    });
}

const getAudioFileMetadataInternal = async (audioFileName) => {
    if(process.env.PROFILE === "prod") return await getAudioFileMetadataFromS3Bucket(audioFileName);
    else if(process.env.PROFILE === "dev") return await getAudioFileMetadataFromLocal(audioFileName);
    else return Promise.reject({
        success: false,
        reason: "Unable to get audio file metadata from the server !",
        message: "Une erreur s'est produite lors de récupération du fichier audio.",
        details: "Profile "+process.env.PROFILE+" not found !",
        httpCode: CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR
    });
}

const removeAudioFileInternal = async (audioFileName) => {
    if(process.env.PROFILE === "prod") return await removeAudioFileFromS3Bucket(audioFileName);
    else if(process.env.PROFILE === "dev") return await removeAudioFileFromLocal(audioFileName);
    else return Promise.reject({
        success: false,
        reason: "Unable to delete audio file from the server !",
        message: "Une erreur s'est produite lors de la suppression du fichier audio.",
        details: "Profile "+process.env.PROFILE+" not found !",
        httpCode: CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR
    });
}

const downloadAudioFileInternal = async (audioFileName) => {
    if(process.env.PROFILE === "prod") return await downloadAudioFileFromS3Bucket(audioFileName);
    else if(process.env.PROFILE === "dev") return await downloadAudioFileFromLocal(audioFileName);
    else return Promise.reject({
        success: false,
        reason: "Unable to download audio file from the server !",
        message: "Une erreur s'est produite lors du téléchargement du fichier audio.",
        details: "Profile "+process.env.PROFILE+" not found !",
        httpCode: CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR
    });
}

module.exports = {uploadAudioFileInternal, getAudioFileInternal, getAudioFileMetadataInternal, removeAudioFileInternal, downloadAudioFileInternal};








