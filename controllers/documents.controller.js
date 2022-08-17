const ControllerModel = require('../models/document.model');
const moment = require('moment')
const fs = require('fs');

module.exports = {
    // Retrieve and return record from the database.
    list: async (req, res, next) => {
        let where = {};

        if (req.query.model) where['model'] = req.query.model;
        if (req.query.key) where['key'] = req.query.key;

        if (req.query.ids) {
            if (req.query.ids == "all") {
                return res.send(await ControllerModel.find(where));
            } else {
                where._id = { $in: req.query.ids.split(",") };
                return res.send(await ControllerModel.find(where));
            }
        } else if (req.query.from && req.query.to) {
            let from = new Date(req.query.from);
            from.setHours(0, 0, 0, 0);
            let to = new Date(req.query.to);
            to.setHours(0, 0, 0, 0);
            where.dated = { $gte: from, $lte: to };
            if (req.query.userId) {
                where['user._id'] = req.query.userId;
            }
            return res.send(await ControllerModel.find(where));
        } else {
            let perPage = req.query.perPage || 20,
                page = Math.max(0, (req.query.page || 1)),
                count = await ControllerModel.count();
            try { perPage = parseInt(perPage) } catch (err) { }

            let employeeId = req.params.employeeId;
            if (employeeId) {
                where['user._id'] = employeeId;
            }
            if (req.query.dated) {
                where['dated'] = req.query.dated;
            }

            ControllerModel.find(where)
                .limit(perPage)
                .skip(perPage * (page - 1))
                .then(async response => {
                    let data = { perPage, page, count, pages: Math.ceil(count / perPage), data: response, };
                    res.send(data);
                }).catch(err => {
                    res.status(500).send({
                        message: "Failed! No record found."
                    });
                });
        }
    },
    getByUser: async (req, res, next) => {
        let employeeId = req.params.employeeId;
        if (process.env.PRODUCTION && employeeId != req.user._id) return res.status(402).send({ "message": "Accessing to unauthorized data" });
        let where = {};
        if (employeeId) {
            where['user._id'] = employeeId;
        }
        if (req.query.dated) {
            where['dated'] = new Date(req.query.dated);
        }

        ControllerModel.find(where)
            .then(async response =>
                res.send(response)).catch(err => {
                    res.status(500).send({
                        message: "Failed! No record found."
                    });
                });
    },
    // Retrieve and return a record from the database.
    findOne: async (req, res, next) => {
        try {
            let response = await ControllerModel.findOne({ "documents._id": req.params.id });
            if (response) {
                res.send(response.documents.find(d => d._id.toString() == req.params.id));
            } else {
                return res.status(404).send({
                    message: "Failed! No record found."
                });
            }
        } catch (err) {
            return res.status(404).send({
                message: "Failed! No record found.",
                err
            });
        }
    },

    // Find one record from database and update.
    findOneAndUpdate: (req, res, next) => {
        req.body.dated = moment(req.body.dated).format("YYYY-MM-DD");
        ControllerModel.findOneAndUpdate({ _id: req.params.id }, {
            $set: req.body
        }, { new: true }).then(async response => {
            res.send(response);
        }).catch(err => {
            res.status(500).send({
                message: "Failed! record cannot be updated."
            });
        });
    },

    // Remove record from database.
    delete: async (req, res, next) => {
        let record = await ControllerModel.findOneAndUpdate({ "documents._id": (req.params.id) }, { $pull: { documents: { _id: (req.params.id) } } });
        if (record) {
            let deletedRecordIndex = record.documents.findIndex(r => r._id == req.params.id);
            if (deletedRecordIndex > -1) {
                let deletedRecord = record.documents[deletedRecordIndex];
                try {
                    fs.unlink(deletedRecord.path, (err) => { });
                } catch (err) { console.warn("Warning.. file is not deleted...", err) }
                record.documents.splice(deletedRecordIndex, 1);
            }
            return res.send(record);
        } else {
            return next({ "message": "Record not found to delete" });
        }
    },
    uploadDocument: (req, res, next) => {
        try {
            let user = req.user || {
                _id: '1',
                name: 'Aman'
            }
            createFromFiles(req, user,
                done => {
                    return res.json(done);
                },
                error => {
                    return res.status(500).send(error);
                })
        }
        catch (error) {
            next({ error: error });
        }
    },
    download: async (req, res, next) => {
        if (req.params.id) {
            let docsObj = await ControllerModel.findOne({ "documents._id": req.params.id })
            if (docsObj) {
                let attachedFile = docsObj.documents.find(d => d._id == req.params.id);
                return res.download(attachedFile.path, attachedFile.originalname);
            } else {
                return next({
                    message: 'No document to download!'
                });
            }
        } else {
            return next({
                message: 'invalid params for file donwload'
            });
        }
    }
}

async function createFromFiles(req, user, done, errorRes) {
    if (!user || !user._id) {
        return errorRes({ message: "id is needed" });
    }
    if(req.files && !req.files.length) {
        return errorRes({ message: "file is needed" });
    }
    let host;
    let file = req.files[0];
    try { host = process.env.BASE_URL || (req.protocol + '://' + req.headers.host); } catch (err) { }
    let doc = {
        user,
        model: req.params.model,
        host,
        key: req.params.id,
        path: file.path,
        originalname: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        encoding: file.encoding
    }
    let newRecord = await ControllerModel.findOne({ model: req.params.model, key: req.params.id });
    if (newRecord) {
        newRecord.documents.push(doc)
    } else {
        newRecord = new ControllerModel(doc);
        newRecord.documents = [doc];
    }

    newRecord.save().then(response => done(response)).catch(errorRes);
}
