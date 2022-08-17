const ControllerModel = require('../models/tweets.model');
const CompanyModel = require('../models/companies.model');
const sharedController = require('./shared.controller');
const moment = require('moment-timezone');
const escapeStringRegexp = require('escape-string-regexp');

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
        if (req.query.verified || req.query.companyName) {
            let companyQ = {};
            if (req.query.verified) companyQ['verified'] = true;
            if (req.query.companyName) {
                companyQ['name'] = new RegExp(req.query.companyName, "i");
            }
            let verifiedCompanies = await CompanyModel.find(companyQ).distinct('_id').lean();
            query['company'] = { $in: verifiedCompanies };
        }

        if (req.query.q) {
            query['$or'] = [
                { text: new RegExp(req.query.q, "i") },
                { url: new RegExp(req.query.q, "i") },
                { symbols: new RegExp(req.query.q, "i") },
            ];
        }
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
                .populate({ path: 'company', select: '_id name verified' })
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
            let response = await ControllerModel.findById({ _id: req.params.id }).populate({ path: 'company', select: '_id name verified' });
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
            res.send(await ControllerModel.findById({ _id: response._id }).populate({ path: 'company', select: '_id name verified' }));
        }).catch(err => {
            next(err);
        });
    },

    addBulk: async (req, res, next) => {
        let companies = await CompanyModel.find({}).select('_id name').lean();
        let bulk = [];
        for (let i = 0; i < req.body.length; i++) {
            let tweet = req.body[i];
            if (tweet.company) {
                // tweet.text = escapeStringRegexp(tweet.text);
                let company = companies.find(c => c.name && tweet.company && c.name.toLowerCase() == tweet.company.toLowerCase());
                if (!company) {
                    console.log(`> company created: ${tweet.company}`);
                    await (new CompanyModel({ name: tweet.company, verified: tweet.verified == 'TRUE' })).save();
                }
            }
        }
        companies = await CompanyModel.find({}).select('_id name').lean();
        for (let i = 0; i < req.body.length; i++) {
            let tweet = req.body[i];
            if (tweet.company) {
                // tweet.text = escapeStringRegexp(tweet.text);
                let company = companies.find(c => c.name && tweet.company && c.name.toLowerCase() == tweet.company.toLowerCase());
                if (company) {
                    if (!await ControllerModel.findOne({ text: tweet.text.trim(), company: company._id })) {
                        let payload = {
                            company: company._id,
                            text: tweet.text,
                            timestamp: tweet.timestamp,
                            externalId: tweet.externalId,
                            symbols: tweet.symbols,
                            url: tweet.url,
                        };
                        bulk.push(payload);
                        console.log(`> bulk push: ${payload.symbols}`);
                        if(bulk.length > 100) {
                            console.log(`> bulk inserting: ...`);
                            await ControllerModel.insertMany(bulk);
                            bulk = [];
                        }
                    }
                }
            }
        }
        if (bulk.length) {
            await ControllerModel.insertMany(bulk);
        }
        res.status(200).send({
            message: `${bulk.length} records are inserted`
        });
    },

    // Find one personal information from database and update.
    findOneAndUpdate: async (req, res, next) => {
        delete req.body._id;
        let record = await ControllerModel.findById(req.params.id);
        if (record) {
            let updated = await record.update({ $set: req.body });
            return res.send(await ControllerModel.findById(req.params.id).populate({ path: 'company', select: '_id name verified' }));
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
