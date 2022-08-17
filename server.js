const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const sharedController = require('./controllers/shared.controller');
const appConfig = require('./config/appConfig');
// Configuring the database
const dbConfig = require('./config/database.config.js');
const mongoose = require('mongoose');
// create express app
const app = express();
/* -------------------------- setting the time zone ------------------------- */
const moment = require('moment-timezone');
moment.tz.setDefault(process.env.TZ || "Asia/Karachi");
// Now it is recommended that we should init dates using moment
/* ----------------------------------- -- ----------------------------------- */

/* -------------------------------------------------------------------------- */
/*                              Socket io manager                             */
const socketManager = require('./utils/socket-io/socket-io.manager');
/* -------------------------------------------------------------------------- */
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", req.header("origin"));
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, apikey");
    res.header('Access-Control-Allow-Credentials', true);
    next();
});
mongoose.Promise = global.Promise;

/* -------------------------------------------------------------------------- */
/*                                Rate limiting                               */
const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
    skip: req => req.method === 'OPTIONS',
    windowMs: 1 * 60 * 1000, // 1 minute
    max: process.env.REQUESTS_PER_MINUTE || 350, // limit each IP to specified requests per windowMs,
    message: { message: `Your IP has been temporarily blocked due to too many requests`, message2: `Please try again later` },
    statusCode: 429
});
app.use(limiter);

/* -------------------------------------------------------------------------- */

const json2xls = require('json2xls');
app.use(json2xls.middleware);


connectDb();

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

routing();


// ====================================================== //
// =============== Web push notifications =============== //
// ====================================================== //
const notificationManager = require('./utils/push-notification/push-notification.manager');
notificationManager.init(app);
// ====================================================== //

// all api routes
function routing() {
    app.use('/api/v1/users', require('./routes/users.routes'));
    app.use('/api/v1/login', require('./routes/login.routes'));
    app.use('/api/v1/project-roles', require('./routes/system.routes'));
    app.use('/api/v1/release-notes', require('./routes/release-notes.routes'));
    app.use('/api/v1/companies', require('./routes/companies.routes'));
    app.use('/api/v1/tweets', require('./routes/tweets.routes'));
}


// listen for requests
// app.listen(process.env.PORT || appConfig.SERVER_PORT, () => {
//     console.log(`> Hi! ${appConfig.API_NAME} Server is listening on port ${appConfig.SERVER_PORT}`);
// });

/* ----- Apply Cool Compression Package For Static JS Bundles (angular) ----- */
app.use(require('compression')())
/* ------------------------------------ - ----------------------------------- */


app.use(require('express').static(path.join(__dirname, 'public/dist/assignment-financial-tweets')));
app.use('/private/avatars', require('express').static(path.join(__dirname, 'private/avatars/')));
app.use('/private/attachments', require('express').static(path.join(__dirname, 'private/attachments/')));
app.use('/private/personal', require('express').static(path.join(__dirname, 'private/personal/')));
app.use('/private/temp', require('express').static(path.join(__dirname, 'private/temp/')));
app.use('/uploads', require('express').static(path.join(__dirname, 'uploads')));

function connectDb() {

    console.log("> connection string: " + dbConfig.url);
    // Connecting to the database
    mongoose.connect(dbConfig.url, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true
    }).then(async () => {
        console.log("> Successfully connected to the database: ", dbConfig.url);
        sharedController.seed();
        socketManager.connect(app, appConfig.SERVER_PORT);


    }).catch(err => {
        console.log('> Could not connect to the database', err);
        console.log(`> Retrying in 5 seconds`);
        setTimeout(() => {
            connectDb();
        }, 5000);
    });
}

errorHandler();

function errorHandler() {
    process.on('uncaughtException', function (err) {
        console.log('uncaughtException', err);
        // throw err;
        process.abort()
    });
    // global error handler
    app.use((error, req, res, next) => {
        console.log("> Gobal error handler says: ", error);
        res.status(406).send(error);
    });
    console.log(`> ${appConfig.API_NAME} Service: Global error handler registered`);
}