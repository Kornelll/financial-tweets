const ControllerModel = require('../models/companies.model');
const sharedController = require('./shared.controller');
const appConfig = require('../config/appConfig');
const moment = require('moment-timezone');


module.exports = {
    // Retrieve and return information from the database.
    list: async (req, res, next) => {
        let query = {};
        if (req.query.name) {
            query['name'] = new RegExp(req.query.name, "i");
        }
        Object.keys(req.query).forEach(key => {
            if (ControllerModel.schema.path(key)) {
                query[key] = new RegExp(req.query[key], "i");
            }
        })
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
            //////////////////////////////////////////
            ControllerModel.find(query)
                .limit(perPage)
                .sort({ createdAt: -1 })
                .skip(perPage * (page - 1))
                .then(async response => {
                    let data = { perPage, page, count, pages: Math.ceil(count / perPage), data: response, };
                    res.send(data);
                }).catch(err => {
                    res.status(500).send({
                        message: "Failed! No information found."
                    });
                });
        }
    },

    // Retrieve and return a information from the database.
    findOne: async (req, res, next) => {
        try {
            let response = await ControllerModel.findById({ _id: req.params.id }).select('+password');
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
    // Add a information to database.
    add: (req, res, next) => {
        let newRecord = new ControllerModel(req.body);
        newRecord.save().then(async response => {
            res.send(response);
        }).catch(err => {
            next(err);
        });
    },

    // Find one personal information from database and update.
    findOneAndUpdate: async (req, res, next) => {
        delete req.body._id;
        let record = await ControllerModel.findById(req.params.id);
        if (record) {
            let updated = await record.update({ $set: req.body });
            return res.send(await ControllerModel.findById(req.params.id));
        } else {
            res.status(500).send({
                message: "Failed! information not found to be updated"
            });
        }
    },

    // Remove personal information from database.
    delete: async (req, res, next) => {
        let record = await ControllerModel.findById(req.params.id);
        if (record) {
            try { res.send(await record.remove()); } catch (err) { next(err); }
        } else {
            res.status(404).send({
                message: "Failed! The record doesn't found"
            });
        }
    }
}
