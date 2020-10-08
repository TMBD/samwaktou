const getAudioStats = async (file) => {
    fs.stat(file, (statError, stats) => {
        if(statError) Promise.reject(statError);
        Promise.resolve({
            size: stats.size
        });
    });
}

exports.getAudioStats = getAudioStats;