import {
    uploadAudioFileToS3Bucket, 
    getAudioFileFromS3Bucket, 
    getAudioFileMetadataFromS3Bucket, 
    removeAudioFileFromS3Bucket, 
    downloadAudioFileFromS3Bucket,
    downloadAudioBucketFromS3
} from './s3-audio-file-uploader';


export const uploadAudioFileInternal = async (file, audioFileName) => {
    return await uploadAudioFileToS3Bucket(file, audioFileName);
}

export const getAudioFileInternal = async (audioFileName, startByte, endByte) => {
    return await getAudioFileFromS3Bucket(audioFileName, startByte, endByte);
}

export const getAudioFileMetadataInternal = async (audioFileName) => {
    return await getAudioFileMetadataFromS3Bucket(audioFileName);
}

export const removeAudioFileInternal = async (audioFileName) => {
    return await removeAudioFileFromS3Bucket(audioFileName);
}

export const downloadAudioFileInternal = async (audioFileName) => {
    return await downloadAudioFileFromS3Bucket(audioFileName);
}

export const downloadAudioBucket = async () => {
    return await downloadAudioBucketFromS3();
}