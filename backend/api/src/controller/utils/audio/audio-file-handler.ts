import { DeleteObjectOutput, GetObjectOutput, HeadObjectOutput } from 'aws-sdk/clients/s3';
import { PassThrough } from 'stream';

import {
    uploadAudioFileToS3Bucket, 
    getAudioFileFromS3Bucket, 
    getAudioFileMetadataFromS3Bucket, 
    removeAudioFileFromS3Bucket, 
    downloadAudioFileFromS3Bucket,
    downloadAudioBucketFromS3
} from './s3-audio-file-uploader';


export const uploadAudioFileInternal = async (data: Buffer, audioFileName: string): Promise<string> => {
    return await uploadAudioFileToS3Bucket(data, audioFileName);
}

export const getAudioFileInternal = async (
    audioFileName: string, 
    startByte: number, 
    endByte: number): Promise<GetObjectOutput> => {
    return await getAudioFileFromS3Bucket(audioFileName, startByte, endByte);
}

export const getAudioFileMetadataInternal = async (audioFileName: string): Promise<HeadObjectOutput> => {
    return await getAudioFileMetadataFromS3Bucket(audioFileName);
}

export const removeAudioFileInternal = async (audioFileName: string): Promise<DeleteObjectOutput> => {
    return await removeAudioFileFromS3Bucket(audioFileName);
}

export const downloadAudioFileInternal = async (audioFileName: string): Promise<PassThrough> => {
    return await downloadAudioFileFromS3Bucket(audioFileName);
}

export const downloadAudioBucket = async (): Promise<PassThrough> => {
    return await downloadAudioBucketFromS3();
}