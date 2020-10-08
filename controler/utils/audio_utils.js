const getAudioStats = (file) => {
    fs.stat(file, (statError, stats) => {
        if(statError) return Promise.reject(statError);
        return Promise.resolve({
            size: stats.size
        });
    });
}

exports.getAudioStats = getAudioStats;