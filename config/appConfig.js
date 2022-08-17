

const path = 'private/attachments/';
const date = require('moment-timezone')();
const dir = date.year() + "/" + date.format('MM');

module.exports = {
    SERVER_PORT: process.env.PORT || 9009,
    API_NAME: 'Assignment - Fincancial Tweets API',
    PROJECT_NAME: process.env.PROJECT_NAME || 'Assignment - Fincancial Tweets',
    APP_URL: process.env.APP_URL || 'http://localhost:4200/#',
    BASE_URL: process.env.BASE_URL || 'http://localhost:4200',
    PWD_SECRET: process.env.PWD_SECRET || 'assignment-secret-ms',
    JWT_SECRET: process.env.JWT_SECRET || 'assignment-secret-jwt',
    ATTACHMENT: {
        PATH_DOCS_GENERAL: `${path}general-docs/${dir}/`,
    },
    MAX_UPLOAD_FILE_SIZE: 25 * 1024 * 1024,
    emailServerConfig: process.env.NODE_ENV == "production" ? {

        host: process.env.EMAIL_HOST || 'smtp.googlemail.com',
        port: process.env.EMAIL_PORT || 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER || '',
            pass: process.env.EMAIL_PASS || ''
        },
        tls: {
            rejectUnauthorized: true
        }

    } : {

        host: process.env.EMAIL_HOST || 'smtp.googlemail.com',
        port: process.env.EMAIL_PORT || 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER || '',
            pass: process.env.EMAIL_PASS || ''
        },
        tls: {
            rejectUnauthorized: true
        }
    },
}