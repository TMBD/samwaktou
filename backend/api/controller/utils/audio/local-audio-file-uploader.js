const SERVEUR_CONFIG = require("../../../config/server.config");
let fs = require('fs');
const path = require('path');

const uploadAudioFileInLocal = async(file, audioFileName) => {
    let audioUri = SERVEUR_CONFIG.FILE_LOCATION.AUDIO_FILE_LOCATION+audioFileName;
    try {
        await file.mv(audioUri);
        return Promise.resolve({ 
            success: true,
            uri: audioUri
        });
    } catch (uploadError) {
        return Promise.reject({ 
            success: false,
            reason: "Couldn't upload the audio file locally !",
            message: "Une erreur s'est produite lors du chargement du fichier audio.",
            details: uploadError,
            httpCode: CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR
        });
    }
}

const getAudioFileFromLocal = (audioFileName, startByte, endByte) => {
    let audioUri = SERVEUR_CONFIG.FILE_LOCATION.AUDIO_FILE_LOCATION + audioFileName;
  
    return new Promise((resolve, reject) => {
      fs.promises.stat(audioUri)
        .then(fileStats => {
          const fileSize = fileStats.size;
          const readSize = endByte - startByte + 1;
  
          if (startByte < 0 || endByte >= fileSize || startByte > endByte) {
            return reject({
              success: false,
              reason: "Invalid byte range",
              message: "Une erreur s'est produite lors de la récupération du fichier audio.",
              details: "Invalid byte range",
              httpCode: CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR
            });
          }
  
          const buffer = Buffer.alloc(readSize);
  
          fs.open(audioUri, 'r', (openError, fileDescriptor) => {
            if (openError) {
              return reject({
                success: false,
                reason: "Error opening audio file",
                message: "Une erreur s'est produite lors de la récupération du fichier audio.",
                details: openError,
                httpCode: CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR
              });
            }
  
            fs.read(fileDescriptor, buffer, 0, readSize, startByte, (readError, bytesRead) => {
              fs.close(fileDescriptor, closeError => {
                if (closeError) {
                  return reject({
                    success: false,
                    reason: "Error closing audio file",
                    message: "Une erreur s'est produite lors de la récupération du fichier audio.",
                    details: closeError,
                    httpCode: CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR
                  });
                }
  
                if (readError) {
                  return reject({
                    success: false,
                    reason: "Error reading audio file",
                    message: "Une erreur s'est produite lors de la récupération du fichier audio.",
                    details: readError,
                    httpCode: CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR
                  });
                }
  
                resolve({
                  success: true,
                  data: {
                    Body: buffer
                  }
                });
              });
            });
          });
        })
        .catch(error => {
          reject({
            success: false,
            reason: "Error getting audio file metadata from local",
            message: "Une erreur s'est produite lors de la récupération du fichier audio.",
            details: error,
            httpCode: CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR
          });
        });
    });
  };

const getAudioFileMetadataFromLocal = async(audioFileName) => {
    let audioUri = SERVEUR_CONFIG.FILE_LOCATION.AUDIO_FILE_LOCATION+audioFileName;
    try{
        const stats = await fs.promises.stat(audioUri);
        return Promise.resolve({
            success: true,
            data: {
                ContentLength: stats.size
            }
        });

    }catch(error){
        return Promise.reject({
            success: false,
            reason: "Error getting audio file metadata from local",
            message: "Une erreur s'est produite lors de la lecture des informations du fichier audio.",
            details: error,
            httpCode: CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR
        });
    }
}

const removeAudioFileFromLocal = async(audioFileName) => {
    let audioUri = SERVEUR_CONFIG.FILE_LOCATION.AUDIO_FILE_LOCATION+audioFileName;
    try {
        await fs.promises.unlink(audioUri);
        return Promise.resolve({
            success: true
        });
    } catch (removeError) {
        return Promise.reject({
            success: false,
            reason: "Couldn't delete audio file from local",
            message: "Une erreur s'est produite lors de la suppression du fichier audio.",
            details: removeError,
            httpCode: CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR
        });
    }
}

const downloadAudioFileFromLocal = async(audioFileName) => {
  let audioUri = SERVEUR_CONFIG.FILE_LOCATION.AUDIO_FILE_LOCATION+audioFileName;
  try {
    const audioFilesFolder = path.resolve(__dirname, "..", "..", "..")
    const audioFilePath = path.join(audioFilesFolder, audioUri);
    
    // Check if the file exists
    if (fs.existsSync(audioFilePath)) {
      // Create a read stream from the local file
      const fileStream = fs.createReadStream(audioFilePath);

      return Promise.resolve({
        success: true,
        data: fileStream,
      });
    } else {
      Promise.reject({
        success: false,
        reason: 'Audio file not found on the server.',
        message: "Une erreur s'est produite lors du téléchargement du fichier audio.",
        details: 'File not found: ' + audioFileName,
        httpCode: CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR
      });
    }
  } catch (error) {
    Promise.reject({
      success: false,
      reason: 'Error while downloading audio file from the server.',
      message: "Une erreur s'est produite lors du téléchargement du fichier audio.",
      details: error.message,
      httpCode: CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR
    });
  }
}


module.exports = {uploadAudioFileInLocal, getAudioFileFromLocal, getAudioFileMetadataFromLocal, removeAudioFileFromLocal, downloadAudioFileFromLocal};