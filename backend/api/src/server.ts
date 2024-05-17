import express from 'express';
import bodyParser from 'body-parser';
import expressFileupload from 'express-fileupload';
import cors, { CorsOptions } from 'cors';

import {SERVEUR_CONFIG, AUDIO_FILE_PARAMS} from './config/server.config';
import audioRoutes from './routes/audio.router';
import adminRoutes from './routes/admin.router';
import userRoutes from './routes/user.router';
import analyticRoutes from './routes/analytic.router';


//Herokou 
//Azur 
const server = express();

//MIDDLEWARES
server.use(bodyParser.json());
server.use(expressFileupload({
    limits: { fileSize: AUDIO_FILE_PARAMS.MAX_FILE_SIZE},
    abortOnLimit: true
}));

//Configure cors and whitelist
let whitelist = [process.env.APP_HOST, process.env.APP_LOAD_BALANCER_HOST]
process.env.APP_CORS_EXTRA_WHITLISTS?.split(" ").filter(host => host).map(host => whitelist.push(host));
const corsOptions : CorsOptions = {
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
server.use("/analytics", analyticRoutes);

//Listening at the port defined in the server_config
server.listen(SERVEUR_CONFIG.PORT);