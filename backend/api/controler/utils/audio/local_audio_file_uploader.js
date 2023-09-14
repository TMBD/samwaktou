const SERVEUR_CONFIG = require("../../../config/server_config");
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
        return Promise.resolve({ 
            success: false,
            message: uploadError,
            details: "Couldn't upload the file locally !"
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
              message: "Invalid byte range",
              details: "Invalid byte range"
            });
          }
  
          const buffer = Buffer.alloc(readSize);
  
          fs.open(audioUri, 'r', (openError, fileDescriptor) => {
            if (openError) {
              return reject({
                success: false,
                message: openError,
                details: "Error opening audio file"
              });
            }
  
            fs.read(fileDescriptor, buffer, 0, readSize, startByte, (readError, bytesRead) => {
              fs.close(fileDescriptor, closeError => {
                if (closeError) {
                  return reject({
                    success: false,
                    message: closeError,
                    details: "Error closing audio file"
                  });
                }
  
                if (readError) {
                  return reject({
                    success: false,
                    message: readError,
                    details: "Error reading audio file"
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
            message: error,
            details: "Error getting audio file metadata from local"
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
        return Promise.resolve({
            success: false,
            message: error,
            details: "Error getting audio file metadata from local"
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
        return Promise.resolve({
            success: false,
            message: removeError,
            details: "Couldn't delete audio file from local"
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

      return {
        success: true,
        data: fileStream,
      };
    } else {
      return {
        success: false,
        message: 'Audio file not found on the server.',
        details: 'File not found: ' + audioFileName,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Error while downloading audio file from the server.',
      details: error.message,
    };
  }
}


module.exports = {uploadAudioFileInLocal, getAudioFileFromLocal, getAudioFileMetadataFromLocal, removeAudioFileFromLocal, downloadAudioFileFromLocal};