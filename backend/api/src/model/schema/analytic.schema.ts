import mongoose, { Model } from "mongoose";

import { IAnalyticDoc } from "../analytic.model";


const AnalyticSchema = new mongoose.Schema<IAnalyticDoc, Model<IAnalyticDoc>>({
    clientId: {
        type: String,
        required: true
    },
    date: {
        type: Date
    },
    eventName: {
        type: String,
        required: true
    },
});

export default mongoose.model<IAnalyticDoc>("Analytic", AnalyticSchema); //has to be refered as analytics in the database