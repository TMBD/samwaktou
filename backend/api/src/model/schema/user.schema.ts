import mongoose, { Model } from "mongoose";

import { USER_VALIDATION_CONFIG } from "../../config/server.config";
import { IUserDoc } from "../user.model";


const UserSchema = new mongoose.Schema<IUserDoc, Model<IUserDoc>>({
    username: {
        type: String,
        required: true,
        min: USER_VALIDATION_CONFIG.MIN_USERNAME_CHAR,
        max: USER_VALIDATION_CONFIG.MAX_USERNAME_CHAR
    },
    tel: {
        type: String,
        required: true,
        min: USER_VALIDATION_CONFIG.MIN_TEL_CHAR,
        max: USER_VALIDATION_CONFIG.MAX_TEL_CHAR
    },
    email: {
        type: String,
        required: false,
        min: USER_VALIDATION_CONFIG.MIN_EMAIL_CHAR,
        max: USER_VALIDATION_CONFIG.MAX_EMAIL_CHAR
    },
    date: {
        type: Date,
        default: Date.now()
    }
});

export default mongoose.model<IUserDoc>("User", UserSchema); //has to be refered as users in the database