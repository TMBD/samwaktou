import {PassThrough, Readable} from 'stream';
import archiver from 'archiver';
import AWS from 'aws-sdk';
import { NextToken } from 'aws-sdk/clients/acm';
import { DeleteObjectOutput, GetObjectOutput, GetObjectRequest, HeadObjectOutput, ListObjectsV2Output, Object } from 'aws-sdk/clients/s3';

import {HTTP_CODE} from './../../../config/server.config';


let s3: AWS.S3;

const audiosBucketName = process.env.S3_ACCESS_POINT_ARN!;

const credentials = new AWS.Credentials({
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!
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

export const uploadAudioFileToS3Bucket = async (data: Buffer, audioFileName: string): Promise<string> => {

    return await s3.putObject({
        Bucket: audiosBucketName,
        Key: audioFileName,
        Body: data
    }).promise()
    .then(
        (_data) => {
            return Promise.resolve(audioFileName)
        },
        (error) => {
            return Promise.reject({
                success: false,
                reason: "Couldn't upload the audio file in s3 bucket",
                message: "Une erreur s'est produite lors du chargement du fichier audio.",
                details: error,
                httpCode: HTTP_CODE.INTERNAL_SERVER_ERROR
            });
        }
    );
}

export const getAudioFileFromS3Bucket = async (
    audioFileName: string, 
    startByte: number, 
    endByte: number): Promise<GetObjectOutput> => {
    const paramRange = `bytes=${startByte}-${endByte}`;
    return await s3.getObject({
        Bucket: audiosBucketName,
        Key: audioFileName,
        Range: paramRange
    }).promise()
    .then(
        (data) => {
            return Promise.resolve(data)
        },
        (error) => {
            return Promise.reject({ 
                success: false,
                reason: "Couldn't get audio file from s3 bucket",
                message: "Une erreur s'est produite lors de la récupération du fichier audio.",
                details: error,
                httpCode: HTTP_CODE.INTERNAL_SERVER_ERROR
            });
        }
    );
}

export const getAudioFileMetadataFromS3Bucket = async (audioFileName: string): Promise<HeadObjectOutput> => {
    return await s3.headObject({
        Bucket: audiosBucketName,
        Key: audioFileName,
    }).promise()
    .then(
        (data) => {
            return Promise.resolve(data)
        },
        (error) => {
            return Promise.reject({ 
                success: false,
                reason: "Couldn't get audio file metadata from s3 bucket",
                message: "Une erreur s'est produite lors de la lecture des informations du fichier audio.",
                details: error,
                httpCode: HTTP_CODE.INTERNAL_SERVER_ERROR
            });
        }
    );
}

export const removeAudioFileFromS3Bucket = async (audioFileName: string): Promise<DeleteObjectOutput> => {
    return await s3.deleteObject({
        Bucket: audiosBucketName,
        Key: audioFileName,
    }).promise()
    .then(
        (data) => {
            return Promise.resolve(data)
        },
        (error) => {
            return Promise.reject({ 
                success: false,
                reason: "Couldn't delete audio file from s3 bucket",
                message: "Une erreur s'est produite lors de la suppression du fichier audio.",
                details: error,
                httpCode: HTTP_CODE.INTERNAL_SERVER_ERROR
            });
        }
    );
}

export const downloadAudioFileFromS3Bucket = async (audioFileName: string): Promise<PassThrough> => {
    return await s3.getObject({
        Bucket: audiosBucketName,
        Key: audioFileName,
    }).promise()
    .then(
        (data) => {
            const stream = new PassThrough();
            stream.end(data.Body);
            return Promise.resolve(stream)
        },
        (error) => {
            return Promise.reject({ 
                success: false,
                reason: "Couldn't download audio file from s3 bucket",
                message: "Une erreur s'est produite lors du téléchargement du fichier audio.",
                details: error,
                httpCode: HTTP_CODE.INTERNAL_SERVER_ERROR
            });
        }
    );
}

export const downloadAudioBucketFromS3 = async (): Promise<PassThrough> => {
    // List all objects in the bucket (handle pagination in case the bucket contains more than 1000 objects)
    const objects: Object[] = await listAllObjects(audiosBucketName);

    // Create a writable stream for the zip file
    const zipStream = new PassThrough();

    // Create an archiver and pipe it to the zip stream
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(zipStream);

    // Download all objects and add them to the zip archive
    const downloadPromises = objects.map(async (object) => {
        const data = await s3.getObject({
            Bucket: audiosBucketName,
            Key: object.Key,
        } as GetObjectRequest).promise();

        // Add the downloaded file to the zip archive
        archive.append((data.Body as Buffer|string|Readable), { name: object.Key! });
    });

    // Wait for all downloads to complete
    await Promise.all(downloadPromises);

    // Finalize the zip archive
    archive.finalize();
    return Promise.resolve(zipStream);
}

export async function listAllObjects(bucketName: string): Promise<Object[]> {
    const allObjects: Object[] = [];
    let continuationToken: NextToken | undefined;

    do {
        const params = {
            Bucket: bucketName,
            ContinuationToken: continuationToken,
        };

        const response: ListObjectsV2Output = await s3.listObjectsV2(params).promise();

        // Add the objects to the array
        allObjects.push(...response.Contents!);

        // Update the continuation token for the next iteration
        continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return Promise.resolve(allObjects);
}