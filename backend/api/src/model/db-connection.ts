import mongoose from "mongoose";

import { parseErrorInJson } from "../controller/utils/utilities";


export default async () => {
    await mongoose.connect(process.env.DB_CONNECTION, {
        authSource: "admin",
        user: process.env.MONGODB_USERNAME,
        pass: process.env.MONGODB_PASSWORD,
        dbName: process.env.MONGODB_DB_NAME
        // useNewUrlParser: true, 
        // useUnifiedTopology: true
    })
    .catch(error => {
        return Promise.reject(parseErrorInJson(error));
    })
    .then(result => {
        return Promise.resolve(result);
    });
}