let express = require("express");
let server = express();
let bodyParser = require("body-parser");
let expressFileupload = require("express-fileupload");
//local files requirements
const CONFIG = require("./config/server_config");
let audioRoutes = require("./routes/audio");
let adminRoutes = require("./routes/admin");
let userRoutes = require("./routes/user");


//MIDDLEWARES
server.use(bodyParser.json());
server.use(expressFileupload({
    limits: { fileSize: CONFIG.AUDIO_FILE_PARAMS.MAX_FILE_SIZE},
    abortOnLimit: true
}));


//ROUTES
server.use("/audios", audioRoutes);
server.use("/admins", adminRoutes);
server.use("/users", userRoutes);


//Listening at the port defined in the server_config
server.listen(CONFIG.SERVEUR_CONFIG.PORT);