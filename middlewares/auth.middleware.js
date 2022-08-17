const appConfig = require('../config/appConfig');
const UserModel = require('../models/users.model');
const jwt = require('jsonwebtoken');
const SystemModel = require('../models/systems.model');
const cryptojsUtil = require('../utils/crypto');

module.exports = {

    auth: async (req, res, next) => {
        // return next();
        let token = req.headers.apikey || req.query.apikey;
        try {
            if (!token || !jwt.verify(token, appConfig.JWT_SECRET)) {
                return res.status(401).send({ status: 401, message: `Authentication Failed` });
            }
        } catch (err) {
            return res.status(401).send({ status: 401, message: `Authentication Failed`, err: err });
        }
        try {
            if (jwt.verify(token, appConfig.JWT_SECRET)) {
                token = jwt.decode(token, appConfig.JWT_SECRET);
                req.user = await UserModel.findById(token.user._id).select('+password').lean();
                if (!req.user) {
                    return res.status(401).send({ status: 401, message: `No user found with provided token, Please login to prove your identity` });
                }
                req.user.id = req.user._id;
                next();
            } else {
                return res.status(401).send({ status: 401, message: `Authentication Failed` });
            }
        } catch (err) {
            return res.status(401).send({ status: 401, message: `Authentication Failed`, err });
        }
    },
    allow: async (user, codes, logic) => {
        if (!user || !user.role) {
            return { allowed: false, message: `No user or role is found` };
        }
        if (!user.role.permissions) {
            await module.exports.populateUserPermissions(user);
        }

        return module.exports.checkPermissions(user.role.permissions, codes, logic);
    },
    allowMiddle: (app) => {
        return async (req, res, next) => {
            if (!req.user.role.permissions) {
                req.user.role = (await SystemModel.findOne({ key: 'acl' }).lean()).roles.find(r => r._id.toString() == req.user.role._id.toString());
            }
            if (app && module.exports.checkPermissions(req.user.role.permissions, app.codes, app.logic).allowed) {
                next();
            } else {
                return res.status(403).send({ status: 403, message: `Dont have permission code [${app.codes.join(', ')}]`, codes: app.codes });
            }
        }
    },

    populateUserPermissions: async (user) => {
        if (!user.role.permissions) {
            user.role = (await SystemModel.findOne({ key: 'acl' })).roles.find(r => r._id.toString() == user.role._id.toString());
        }
    },

    checkPermissions: (permissions, codes, logic) => {
        if (!codes) return { allowed: false, message: 'No code provided' };
        if (!permissions) return { allowed: false, message: 'No permissions provided' }
        try {
            if (!logic) {
                logic = 'and';
            }
            allowed = true;
            if (logic == 'and') {
                for (var i = 0; i < codes.length && allowed; i++) {
                    var code = codes[i];
                    if (permissions.findIndex(permission => permission.module == code || permission.code == code) == -1) {
                        allowed = false;
                        break;
                    }
                }
            } else {
                allowed = false;
                for (var i = 0; i < codes.length && !allowed; i++) {
                    var code = codes[i];
                    if (permissions.findIndex(permission => permission.module == code || permission.code == code) > -1) {
                        allowed = true;
                        break;
                    }
                }
            }
            if (!allowed) {
                return { allowed: false, message: `Dont have permission code [${codes.join(', ')}]`, status: 403 };
            }
            return { allowed: true };
        } catch (err) {
            return { allowed: true, err }
        }
    }
}