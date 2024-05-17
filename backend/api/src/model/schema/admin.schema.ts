import mongoose, { Model } from "mongoose";

import { ADMIN_VALIDATION_CONFIG } from "../../config/server.config";
import { IAdminDoc } from "../admin.model";


const AdminSchema = new mongoose.Schema<IAdminDoc, Model<IAdminDoc>>({
    surname: {
        type: String,
        required: true,
        min: ADMIN_VALIDATION_CONFIG.MIN_SURNAME_CHAR,
        max: ADMIN_VALIDATION_CONFIG.MAX_SURNAME_CHAR
    },
    name: {
        type: String,
        required: true,
        min: ADMIN_VALIDATION_CONFIG.MIN_NAME_CHAR,
        max: ADMIN_VALIDATION_CONFIG.MAX_NAME_CHAR
    },
    email: {
        type: String,
        required: true,
        min: ADMIN_VALIDATION_CONFIG.MIN_EMAIL_CHAR,
        max: ADMIN_VALIDATION_CONFIG.MAX_EMAIL_CHAR
    },
    password: {
        type: String,
        required: true,
        min: ADMIN_VALIDATION_CONFIG.MIN_PASSWORD_CHAR,
        max: ADMIN_VALIDATION_CONFIG.MAX_PASSWORD_CHAR
    },
    date: {
        type: Date,
        default: Date.now()
    },
    isSuperAdmin: {
        type: Boolean,
        default: false
        
    }
});

export default mongoose.model<IAdminDoc>("Admin", AdminSchema); //has to be refered as admins in the database