let Analytic = require("../model/analytic.model");
let {parseErrorInJson} = require("./utils/utilities");
const CONFIG = require("../config/server.config");

let postAnalytic = async (req, res) => {
    try{
        var analytic = new Analytic(req.body.clientId, req.body.date, req.body.eventName);
        let result = await analytic.saveToDB();
        res.status(CONFIG.HTTP_CODE.OK);
        res.json(result.data);
    }catch(exception){
        res.status(exception.httpCode ? exception.httpCode : CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}

exports.postAnalytic = postAnalytic;