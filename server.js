let express = require("express");
let server = express();
let bodyParser = require("body-parser");
//local files requirements
const config = require("./config/server_config");
let audioRoutes = require("./routes/audio");


//MIDDLEWARES
server.use(bodyParser.json());

//ROUTES
server.use("/audios", audioRoutes);


//Listening at the port defined in the server_config
server.listen(config.SERVEUR_CONFIG.PORT);