let express = require("express");
let server = express();
let bodyParser = require("body-parser");
let expressFileupload = require("express-fileupload");
let cors = require("cors");
//local files requirements
const CONFIG = require("./config/ServerConfig");
let audioRoutes = require("./routes/AudioRoute");
let adminRoutes = require("./routes/AdminRoute");
let userRoutes = require("./routes/UserRoute");

//Herokou 
//Azur 

//MIDDLEWARES
server.use(bodyParser.json());
server.use(expressFileupload({
    limits: { fileSize: CONFIG.AUDIO_FILE_PARAMS.MAX_FILE_SIZE},
    abortOnLimit: true
}));

//Configure cors and whitelist
let whitelist = [process.env.APP_HOST, process.env.APP_LOAD_BALANCER_HOST]
process.env.APP_CORS_EXTRA_WHITLISTS.split(" ").filter(host => host).map(host => whitelist.push(host));
const corsOptions = {
    origin: function (origin, callback) {
        if(!origin) callback(null, true);
        else {
            const url = new URL(origin);
            const host = url.protocol + "//" + url.hostname;
            if (whitelist.indexOf(host) !== -1 || !origin) {
                callback(null, true);
            }
            else {
                callback(new Error('Not allowed by CORS'));
            }
        }
    }
}

server.use(cors(corsOptions));


//ROUTES
server.use("/audios", audioRoutes);
server.use("/admins", adminRoutes);
server.use("/users", userRoutes);

//Listening at the port defined in the server_config
server.listen(CONFIG.SERVEUR_CONFIG.PORT);