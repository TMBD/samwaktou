let fs = require('fs');
const getAudioStats = (file) => {
    fs.stat(file, (statError, stats) => {
        if(statError) return Promise.reject(statError);
        return Promise.resolve({
            size: stats.size
        });
    });
}

const removeAudioFile = async (uri) => {
    try {
        await fs.unlinkSync(uri);
        return Promise.resolve({
            success: true
        });
    } catch (removeError) {
        return Promise.resolve({
            success: false,
            message: removeError
        });
    }
}

exports.getAudioStats = getAudioStats;
exports.removeAudioFile = removeAudioFile;