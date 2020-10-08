const validatePostAudioRequest = (req) => {
    let body = req.body;
    if(!body.description){
        return {
            success: false,
            details: "description field is required !"
        };
    } 
    if(!body.keywords){
        return {
            success: false,
            details: "keywords field is required !"
        };
    }
    if(!req.files.audio.mimetype.includes("audio")){
        return {
            success: false,
            details: "Only audio types are accepted !"
        };
    }

    return {success: true};
}

exports.validatePostAudioRequest = validatePostAudioRequest;