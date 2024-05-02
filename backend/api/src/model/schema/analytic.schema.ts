import mongoose from "mongoose";


let AnalyticSchema = new mongoose.Schema({
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

export default mongoose.model("Analytic", AnalyticSchema); //has to be refered as analytics in the database