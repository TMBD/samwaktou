import mongoose, { Model } from "mongoose";

import { AUDIO_VALIDATION_CONFIG } from "../../config/server.config";
import { IAudioDoc } from "../audio.model";


let AudioSchema = new mongoose.Schema<IAudioDoc, Model<IAudioDoc>>({
    uri:{
        type: String,
        required: true
    },
    theme: {
        type: String,
        required: true,
        max: AUDIO_VALIDATION_CONFIG.MAX_THEME_CHAR,
        min: AUDIO_VALIDATION_CONFIG.MIN_THEME_CHAR
    },
    author: {
        type: String,
        required: false,
        max: AUDIO_VALIDATION_CONFIG.MAX_AUTHOR_CHAR,
        min: AUDIO_VALIDATION_CONFIG.MIN_AUTHOR_CHAR,
        default: "Inconnu"
    },
    description: {
        type: String,
        required: true,
        max: AUDIO_VALIDATION_CONFIG.MAX_DESCRIPTION_CHAR,
        min: AUDIO_VALIDATION_CONFIG.MIN_DESCRIPTION_CHAR
    },
    date: {
        type: Date,
        default: Date.now()
    },
    keywords: {
        type: String,
        required: true,
        max: AUDIO_VALIDATION_CONFIG.MAX_KEYWORDS_CHAR,
        min: AUDIO_VALIDATION_CONFIG.MIN_KEYWORDS_CHAR
    }
});

export default mongoose.model<IAudioDoc>("Audio", AudioSchema); //has to be refered as audios in the database