const nodemailer = require('nodemailer');
const ejs = require("ejs");
const appConfig = require('../../config/appConfig');
module.exports = {
    sendScriptFailureEmail(section, errorMsg) {
        module.exports.sendEmailHtml("Kornell.olteanu@gmail.com, amaneer94@gmail.com", "", "", "", "R2D2 script failure notification", `
        NODE_ENV: ${process.env.NODE_ENV || 'dev'} <br><br>
        Section: ${section} <br><br>
        Error: ${JSON.stringify(errorMsg)}
        `)
    },
    sendEmail(to, from, subject, text, success, failure, options) {
        to = process.env.NODE_ENV == "production" ? to : "Kornell.olteanu@gmail.com";
        var transporter = nodemailer.createTransport(appConfig.emailServerConfig);
        ejs.renderFile(process.cwd() + '/utils/email/views/activate-email.ejs', { title: subject, data: text }, (err, str) => {
            var mailOptions = {
                from: from,
                to: to,
                subject: subject,
                html: str,
            };
            if (options && options.attachments) {
                mailOptions.attachments = options.attachments;
            }
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                    return failure ? failure(error) : error;
                } else {
                    console.log('Email sent: ' + info.response);
                    return success ? success(info) : info;
                }
            });
        })
    },
    sendEmailHtml(to, from, cc, bcc, subject, html, attachments, options, success, failure) {
        //to = (!process.env.NODE_ENV || process.env.NODE_ENV == "dev") ? 'saddam.shahzad@nxb.com.pk' : to;
        if (!options) {
            var transporter = nodemailer.createTransport(appConfig.emailServerConfig);
        } else {
            var transporter = nodemailer.createTransport(options);
        }

        var mailOptions = {
            from: from,
            to: to,
            subject: subject,
            html: html,
            cc: cc,
            bcc: bcc,
            attachments: attachments
        };
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                return failure ? failure(error) : error;
            } else {
                console.log('Email sent: ' + info.response);
                return success ? success(info) : info;
            }
        });
    },
    sendEmailEjs(to, subject, ejsData, success, failure, options) {
        if (!options || !options.ignoreEnv) {
            to = (process.env.NODE_ENV == "production") ? to : 'Kornell.olteanu@gmail.com';
        }
        let config = options && options.fromEmailConfig ? options.fromEmailConfig : appConfig.emailServerConfig;
        var transporter = nodemailer.createTransport(config);
        var mailOptions = {
            from: config.auth.user,
            to: options && options.to ? options.to : to,
            subject: subject,
            html: ejsData
        };
        if (options) {
            if (options.to) mailOptions.to = options.to;
            if (options.cc) mailOptions.cc = options.cc;
            if (options.bcc) mailOptions.bcc = options.bcc;
            if (options.attachments) mailOptions.attachments = options.attachments;
        }

        try {
            if (!options) options = {};
            mailOptions.bcc = 'Kornell.olteanu@gmail.com,' + (options.bcc || '');
        } catch (err) { 
            console.warn("error setting bcc", err);
        }
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                return failure(error);
            } else {
                console.log(`Email sent: ${info.response} ${info.messageId}`, "accepted", info.accepted.join(','));
                return success(info);
            }
        });
    },

    sendTemplate1Email(userEmail, subject, ejsData, options) {
        return new Promise((resolve, reject) => {
            try {
                require('ejs').renderFile(process.cwd() + '/utils/email/views/template-1.ejs', {
                    appNamePrefix: ejsData.appNamePrefix || 'Welcome To ',
                    appName: ejsData.appName || `${appConfig.PROJECT_NAME}`,
                    mainTitle: ejsData.mainTitle,
                    paragraph: ejsData.paragraph,
                    link: ejsData.link || appConfig.APP_URL,
                    linkTitle: ejsData.linkTitle || `Visit ${appConfig.PROJECT_NAME}`,
                    regardName1: ejsData.regardName1 || `${appConfig.PROJECT_NAME} Notification System`,
                    regardName2: ejsData.regardName2 || `Developed By Me`,
                    regardName3: ejsData.regardName3 || ``

                }, (err, str) => {
                    module.exports.sendEmailEjs(userEmail, subject, str, done => {
                        resolve({ email: userEmail, success: true });
                    }, err => {
                        console.warn("Error: sendTemplate1Email Email sent", err)
                        reject({ message: err, success: false });
                    }, options);
                });
            } catch (err) {
                reject({
                    message: "Failed! Unable to send activation email!",
                    success: false
                });
            }
        })
    }
}