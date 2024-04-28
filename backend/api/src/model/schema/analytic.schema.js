let mongoose = require("mongoose");

let AnalyticSchema = mongoose.Schema({
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

module.exports = mongoose.model("Analytic", AnalyticSchema); //has to be refered as analytics in the database