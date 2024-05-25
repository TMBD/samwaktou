import {PassThrough} from 'stream';
import archiver from 'archiver';
import {
    DeleteObjectCommandOutput,
    GetObjectCommandInput,
    HeadObjectCommandOutput,
    ListObjectsV2CommandOutput,
    _Object,
    S3
} from "@aws-sdk/client-s3";
import { AwsCredentialIdentity } from '@aws-sdk/types';

import {HTTP_CODE} from './../../../config/server.config';


let s3: S3;

const audiosBucketName = process.env.S3_ACCESS_POINT_ARN!;

const credentials : AwsCredentialIdentity = {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!
};

if(process.env.PROFILE === "prod"){
    s3 = new S3({
        region: "us-east-2",
        credentials: credentials,
    });
} else if (process.env.PROFILE === "dev"){
    s3 = new S3({
        region: "us-east-2",
        credentials: credentials,
        endpoint: "http://127.0.0.1:9000",

        // The key s3ForcePathStyle is renamed to forcePathStyle.
        forcePathStyle: true,
    });
}

export const uploadAudioFileToS3Bucket = async (data: Buffer, audioFileName: string): Promise<string> => {

    return await s3.putObject({
        Bucket: audiosBucketName,
        Key: audioFileName,
        Body: data
    })
    .then(
        (_data) => {
            return Promise.resolve(audioFileName);
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
    endByte: number): Promise<Uint8Array> => {
    const paramRange = `bytes=${startByte}-${endByte}`;
    return await s3.getObject({
        Bucket: audiosBucketName,
        Key: audioFileName,
        Range: paramRange
    })
    .then(
        async (data) => {
            return Promise.resolve(await data.Body.transformToByteArray());
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

export const getAudioFileMetadataFromS3Bucket = async (audioFileName: string): Promise<HeadObjectCommandOutput> => {
    return await s3.headObject({
        Bucket: audiosBucketName,
        Key: audioFileName,
    })
    .then(
        (data) => {
            return Promise.resolve(data);
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

export const removeAudioFileFromS3Bucket = async (audioFileName: string): Promise<DeleteObjectCommandOutput> => {
    return await s3.deleteObject({
        Bucket: audiosBucketName,
        Key: audioFileName,
    })
    .then(
        (data) => {
            return Promise.resolve(data);
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
    })
    .then(
        async (data) => {
            const stream = new PassThrough();
            stream.end(await data.Body.transformToByteArray());
            return Promise.resolve(stream);
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
    const objects: _Object[] = await listAllObjects(audiosBucketName);

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
        } as GetObjectCommandInput);

        // Add the downloaded file to the zip archive
        archive.append((Buffer.from(await data.Body.transformToByteArray())), { name: object.Key! });
    });

    // Wait for all downloads to complete
    await Promise.all(downloadPromises);

    // Finalize the zip archive
    archive.finalize();
    return Promise.resolve(zipStream);
}

async function listAllObjects(bucketName: string): Promise<_Object[]> {
    const allObjects: _Object[] = [];
    let continuationToken: string | undefined;

    do {
        const params = {
            Bucket: bucketName,
            ContinuationToken: continuationToken,
        };

        const response: ListObjectsV2CommandOutput = await s3.listObjectsV2(params);

        // Add the objects to the array
        allObjects.push(...response.Contents!);

        // Update the continuation token for the next iteration
        continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return Promise.resolve(allObjects);
}