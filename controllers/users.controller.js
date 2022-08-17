const ControllerModel = require('../models/users.model');
const sharedController = require('./shared.controller');
const jwt = require('jsonwebtoken');
const fetch = require("node-fetch");
const cryptojsUtil = require('../utils/crypto');
const appConfig = require('../config/appConfig');
const sendEmail = require('../utils/email/sendEmail');
const moment = require('moment-timezone');
const alerts = require('./../config/alerts.config');
const chance = require('chance')();
const escapeStringRegexp = require('escape-string-regexp');
const authWare = require('../middlewares/auth.middleware');
const notificationManager = require('../utils/push-notification/push-notification.manager');

module.exports = {
    login: async (req, res, next) => {
        let user = await ControllerModel.findOne({
            $or: [
                { 'email': new RegExp(`^${escapeStringRegexp(`${req.body.email}`)}`, "i") },
                { 'cnic': req.body.email }
            ]
        })
            .select('+password')
            .lean();
        if (user) {
            if (user && req.body.password == cryptojsUtil.decrypt(user.password, appConfig.PWD_SECRET)) {
                if (user.accountStatus == 'waiting') {
                    return next(alerts.LOGIN.WAITING_APPROVAL);
                }
                res.send(await getUserLoginDetails(user));
            } else {
                next(alerts.LOGIN.PASS_INVALID);
            }
        } else {
            next(alerts.LOGIN.USER_NOT_FOUND);
        }
    },
    logout: async (req, res, next) => {
        try { var subscription = typeof req.body.notificationSubscription == "string" ? JSON.parse(req.body.notificationSubscription) : req.body.notificationSubscription; } catch (err) { subscription = null }
        res.send(await notificationManager.removeSubscription(subscription));

    },
    // Retrieve and return information from the database.
    list: async (req, res, next) => {
        let query = {};
        
        if (req.query.name) {
            query['name'] = new RegExp(req.query.name, "i");
        }
        

        /* --------------------------- Permission control --------------------------- */
        let viewAllUsersCheck = await authWare.allow(req.user, ['user_view_all']);
        if (!viewAllUsersCheck.allowed) {
        }
        /* ----------------------------------- -- ----------------------------------- */

        if (req.query.ids) {
            if (req.query.ids != "all") {
                query['_id'] = { $in: req.query.ids.split(",") };
            }
            let projection = {};
            if (req.query.fields) {
                req.query.fields.split(",").forEach(field => {
                    projection[field] = 1;
                })
            }
            let records = ControllerModel.find(query, projection);
            return res.send(await records);
        } else {
            let perPage = req.query.perPage || 20,
                page = Math.max(0, (req.query.page || 1)),
                count = await ControllerModel.count(query);
            try { perPage = parseInt(perPage) } catch (err) { }
            /* This is to automate query criterial */
            // delete req.query.perPage;
            // delete req.query.page;
            // delete req.query.apikey;
            Object.keys(req.query).forEach(key => {
                if (ControllerModel.schema.path(key)) {
                    query[key] = new RegExp(req.query[key], "i");
                }
            })
            //////////////////////////////////////////
            let usersPromise = ControllerModel.find(query)
                .limit(perPage)
                .skip(perPage * (page - 1));
            
            usersPromise.then(async response => {
                let data = { perPage, page, count, pages: Math.ceil(count / perPage), data: response, viewAllUsersCheck };
                res.send(data);
            }).catch(err => {
                res.status(500).send({
                    message: "Failed! No personal information found due to api crash",
                    err
                });
            });
        }
    },

    // Retrieve and return a information from the database.
    findOne: async (req, res, next) => {
        try {
            let response = ControllerModel.findById(req.params.id);
            if (req.query.forEdit) {
                response = response.populate('college');
            }
            response = await response;
            if (response) {
                res.send(response);
            } else {
                return res.status(500).send({
                    message: "Failed! No information found."
                });
            }
        } catch (err) {
            return res.status(500).send({
                message: "Failed! No information found."
            });
        }
    },

    // Retrive and return a person by email
    findByEmail: async (req, res, next) => {
        console.log('------------ By Email ------------');
        let response = await ControllerModel.find({}, { emails: true, name: true });
        if (response.length > 0) {
            res.send(response)
        } else {
            res.status(500).send({
                message: 'Failed! No record found.',
                status: 404
            });
        }
    },

    // Add a information to database.
    add: async (req, res, next) => {
        if (!req.body.role || !req.body.role._id) {
            try { req.body.role = sharedController.ACL_DATA.roles[1] } catch (err) { console.warn(`Not able to assign default role: applicant`) }
        }
        req.body.activation = { code: chance.integer({ min: 100000, max: 999999 }), last: moment(), tries: 0 };
        await validateUserPermissionsForBody(req, true);
        let newRecord = new ControllerModel(req.body);
        newRecord.save().then(async response => {
            if (!req.user) {
                sendActivationCode(response, false);
            } else {
                if (req.body.notifyApproval && req.body.accountStatus == 'approved') {
                    sendApprovalEmail(req.body.email, response, req.user ? req.user.name : '', true);
                }
            }

            saveAvatar(req.body.avatar, response);
            res.send(response);
        }).catch(err => {
            res.status(406).send({
                message: "Failed! record cannot be added!",
                err
            });
        });
    },

    resendActivationCode: async (req, res, next) => {

        try {
            let data = req.body.data;
            req.body = JSON.parse(cryptojsUtil.decrypt(req.body.data));
            let email = req.body.email;
            let user = await ControllerModel.findOne({ email: email, "activation.code": { $ne: null }, "activation.lastResendTimestamp": { $ne: req.body.timestamp } });
            if (!user) return next({ message: `No user found for activation` });

            if (user.activation.lastResendTimestamp) {
                let duration = moment.duration(moment().diff(moment(user.activation.lastResendTimestamp)));
                let minutes = duration.asMinutes();
                if (minutes <= 3) {
                    return next({ message: `You have already requested for resend recently`, message2: `Please try again later after 3-4 minutes if you still don't receive activation code.` })
                }
            }


            sendActivationCode(user, true);
            await user.update({
                $set: {
                    "activation.lastResendTimestamp": req.body.timestamp
                }
            })
            res.send({ message: `Activation code is sent to ${email} & +${user.phone}` });
        } catch (err) {
            next({ message: `Something went wrong!`, message2: `Please try again later with valid information`, err });
        }
    },

    addBulk: async (req, res, next) => {
        var bulk = ControllerModel.collection.initializeUnorderedBulkOp();
        req.body.forEach(function (record) {
            var query = {};
            query["emails.email"] = record.emails[0].email;
            bulk.find(query).upsert().updateOne({
                $set: {
                    "oid": record["oid"],
                    "code": record["code"],
                    "callingName": record["callingName"],
                    "emails": record["emails"],
                    "type": record["type"],
                    "isLdap": record["isLdap"],
                    "createType": record["createType"],
                    "name": record["name"],
                    "joiningDate": record["joiningDate"]
                }
            });
        });
        bulk.execute(async (err, bulkres) => {
            let employees = await ControllerModel.find({});
            if (err) return next({ err, status: 500, bulkres, employees });
            return res.send({ bulkres, employees });
        });
    },

    changePassword: async (req, res, next) => {
        if (req.body.newPassword != req.body.matchPassword) {
            return next({ message: `Re-entered password doesn't match new one` });
        }
        if (req.body.currentPassword != cryptojsUtil.decrypt(req.user.password, appConfig.PWD_SECRET)) {
            return next({ message: `Current password is incorrect` });
        }
        req.user.password = req.body.newPassword;

        return res.send(await ControllerModel.findByIdAndUpdate(req.user._id, { password: req.body.newPassword }));
    },

    // Find one personal information from database and update.
    findOneAndUpdate: async (req, res, next) => {
        try {
            delete req.body._id;
            await validateUserPermissionsForBody(req, false);
            let user = await ControllerModel.findById(req.params.id).select('+password');
            if (user) {
                let approvalStatus = user.accountStatus;
                if (approvalStatus == 'waiting' && req.body.accountStatus == 'approved') {
                    req.body.approvedAt = moment();
                    req.body.approvedBy = {
                        _id: req.user ? req.user._id : '',
                        name: req.user ? req.user.name : 'Unknown'
                    }
                    if (req.body.notifyApproval) {
                        sendApprovalEmail(req.body.email, user, req.user ? req.user.name : '');
                    }
                }
                let updated = await user.update({ $set: req.body });
                saveAvatar(req.body.avatar, user._id);
                module.exports.findOne(req, res, next);
            } else {
                res.status(500).send({
                    message: "Failed! information not found to be updated"
                });
            }
        } catch (err) {
            return next(err);
        }



        // ControllerModel.findOneAndUpdate({ _id: req.params.id }, {
        //     $set: req.body
        // }, { new: true }).then(async response => {
        //     res.send(response);
        // }).catch(err => {
        // res.status(500).send({
        //     message: "Failed! personal information cannot be updated.",
        //     err
        // });
        // });
    },

    // Remove personal information from database.
    delete: (req, res, next) => {
        ControllerModel.deleteOne({ _id: req.params.id }).then(response => {
            res.send(response);
        }).catch(err => {
            res.status(500).send({
                message: "Failed! personal information cannot be deleted!"
            });
        });
    },

    activateEmail: async (req, res, next) => {
        let id = req.body.id;
        let token = req.body.token;
        let record = await ControllerModel.findOne({ _id: id, resetToken: token });
        if (record) {
            record.resetToken = null;
            let rolesData = await (await fetch(`${appConfig.ACL_SERVICE}/project-roles?modelIds=1&ids=all&apikey=${process.env.APIKEY || 'qAkUZ9VcgpSUJuC0jkThJSTQXGe2xXUA'}`)).json();
            if (rolesData && rolesData.length) {
                let role = rolesData[0].roles.find(r => r.name && r.name.toLowerCase() == 'applicant')
                if (role) {
                    record.role = { _id: role._id, name: role.name };
                }
            }
            record.isActive = true;
            record = await record.save();
            record._doc.message = "User activated successfully";
            return res.send(record);
        } else {
            return next({ message: "Cannot find user to activate from token. Please regenerate email to activate", status: 404 });
        }
    },

    activateAccount: async (req, res, next) => {

        let record = await ControllerModel.findOne({ email: req.body.email, 'activation.code': req.body.code }).select("+password");
        if (record) {
            if (req.body.password != cryptojsUtil.decrypt(record.password, appConfig.PWD_SECRET)) {
                return next({ message: `Your password doesn't match`, message2: `Please valid password` });
            }
            record.activation = null;
            record.accountStatus = 'activated';
            await record.save();
            module.exports.login(req, res, next);
        } else {
            return next({ message: "Cannot find user to activate from the given details", message2: "Please provide valid information to activate account", status: 404 });
        }
    },

    forgotPassword: async (req, res, next) => {
        let user = await ControllerModel.findOne({ $or: [{ 'email': new RegExp(`^${escapeStringRegexp(`${req.body.email}`)}`) }, { 'cnic': req.body.email }, { 'phone': req.body.email }] }).select('+password');
        if (user) {
            user.resetToken = chance.guid();
            sendEmail.sendTemplate1Email(user.email, "SU Examination Online Admissions: Reset Password Request", {
                appNamePrefix: 'Dear User ',
                appName: user.name,
                mainTitle: `Did you forget your password? That is no longer an issue because we have a reset password link for you below.`,
                paragraph: `Please click on the reset button below to change your password.`,
                link: `${appConfig.APP_URL}/reset-password?_id=${user._id}&token=${user.resetToken}&email=${user.email}`,
                linkTitle: 'Reset Password',
                regardName1: '',
                regardName2: '',
                regardName3: '',
            });
            await user.save();
            res.send({ message: `Reset password email sent`, message2: `Please check inbox of your account ${sharedController.censorEmail(user.email)}` });
        } else {
            next({ message: `No account is associated with ${req.body.email}`, code: 412 });
        }
    },

    resetPassword: async (req, res, next) => {
        let body = req.body;
        if (body.newPassword != body.matchPassword) {
            return next({ message: `Re-entered password doesn't match new one` });
        }
        let user = await ControllerModel.findOne({ _id: body._id, resetToken: body.token });
        if (user) {
            user.password = body.newPassword;
            user.resetToken = null;
            await user.save();
            res.send({ message: 'Your password has been reset successfully' });
        } else {
            return next({ message: `Your request to reset the password is either invalid or expired.`, message2: 'Suggestion: Please generate a new request by using forgot password' });
        }
    },

    saveConfigurations: async (req, res, next) => {
        let user = await ControllerModel.findByIdAndUpdate(req.params.id, {
            $set: {
                configurations: req.body
            }
        }, { new: true }).lean();
        if (user._id.toString() == req.user._id.toString()) {
            let loginData = await getUserLoginDetails(user);
            return res.send(loginData.user);
        } else {
            res.send(user)
        }
    }
}
function sendApprovalEmail(email, user, regardName1, createdAndApproved) {
    sendEmail.sendTemplate1Email(email, "SU Examination Online Admissions: Account Activation", {
        appNamePrefix: 'Welcome Dear ',
        appName: user.name,
        mainTitle: `Your acocunt is ${createdAndApproved ? 'created & ' : ''} approved in SU Examination Online Admissions`,
        paragraph: `Following are the credentials:<br>Email: ${email}<br>Pass: ${cryptojsUtil.decrypt(user.password, appConfig.PWD_SECRET)}`,
        link: `${appConfig.APP_URL}/login?email=${email}`,
        linkTitle: 'Login',
        regardName1: regardName1,
        regardName2: '',
        regardName3: '',
    })
}


async function saveAvatar(avatarBase64, userId) {
    if (!avatarBase64 || !userId) {
        return;
    }
    let filename = `${userId}.png`;
    let relativePath = 'avatars';

    let response = sharedController.saveBase64AsImage(avatarBase64, relativePath, filename);

    await ControllerModel.findByIdAndUpdate(userId).update({ avatarSrc: response.avatarSrc });
}

async function validateUserPermissionsForBody(req, addCase) {
    let checkAssignAppLevel = (await authWare.allow(req.user, ['user_assign_app_role']));
    if (req.body.role && !checkAssignAppLevel.allowed) {
        if (addCase) {
            req.body.role = {
                _id: "5da635754bfd75273d779e86",
                name: 'applicant'
            }
        } else {
            delete req.body.role;
        }
    }

    if (req.user && req.body.skillCategories && req.body.skillCategories.length) {
        let checkAppLevelSkills = await authWare.allow(req.user, ['user_manage_skills']);
        if (!(checkAppLevelSkills.allowed)) {
            checkAppLevelSkills = await authWare.allowDpt(req.user, ['member_manage_skills']);
        }
    }

}

async function getUserLoginDetails(user) {
    await authWare.populateUserPermissions(user);
    try { delete user.department.roles; } catch (err) { }
    let token = jwt.sign({ user: { _id: user._id, name: user.name, email: user.email } }, appConfig.JWT_SECRET, {
        expiresIn: '24h' // expires in 24 hours
    });
    return { user, token };
}

function sendActivationCode(user, isResend) {
    // sendEmail.sendTemplate1Email(user.email, "SU Examination Online Admissions: Your account activation code", {
    //     appNamePrefix: 'Dear ',
    //     appName: user.name,
    //     mainTitle: isResend ? `You requested to resend the activation code` : `Your acocunt has been created in SU Examination Online Admissions against email ${user.email}.`,
    //     paragraph: `SU Online Admissons: Your account activation code is ${user.activation.code}`,
    //     link: appConfig.APP_URL,
    //     linkTitle: 'Visit Site',
    //     regardName1: '',
    //     regardName2: '',
    //     regardName3: '',
    // });
    // const sms = require('../utils/sms/sms');
    // sms.sendSms(user.phone, `SU: Your activation code is ${user.activation.code}`);
    console.log("bypass sendActivationCode", user, isResend);
}