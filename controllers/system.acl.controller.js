const ProjectRolesModel = require('../models/systems.model');
// const sharedController = require("./shared.controller");
module.exports = {
    // Retrieve and return record from the database.
    list: async (req, res, next) => {
        let where = {};
        if (req.query.modelIds) {
            where['key'] = { $in: req.query.modelIds.split(",") };
        }
        if (req.query.ids) {
            if (req.query.ids == "all") {
                return res.send(await ProjectRolesModel.find(where));
            } else {
                where._id = { $in: req.query.ids.split(",") };
            }
            return res.send(await ProjectRolesModel.find(where));
        } else {
            let perPage = req.query.perPage || 20,
                page = Math.max(0, (req.query.page || 1)),
                count = await ProjectRolesModel.count(where);
            try { perPage = parseInt(perPage) } catch (err) { }

            ProjectRolesModel.find(where)
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
    listByKey: async (req, res, next) => {
        let newRecord = await ProjectRolesModel.findOne({ "key": req.params.key });
        return res.send(newRecord);
    },
    // Retrieve and return a record from the database.
    findOne: async (req, res, next) => {
        try {
            let response = await ProjectRolesModel.findById({ _id: req.params.id });
            if (response) {
                res.send(response);
            } else {
                return res.status(500).send({
                    message: "Failed! No record found."
                });
            }
        } catch (err) {
            return res.status(500).send({
                message: "Failed! No record found."
            });
        }
    },
    findByRoleId: async (req, res, next) => {
        try {
            let response = await ProjectRolesModel.findOne({ "roles._id": req.params.id });
            if (response) {
                return res.send(response.roles.find(r => r._id == req.params.id));
            } else {
                return res.status(500).send({
                    message: "Failed! No record found"
                });
            }
        } catch (err) {
            return res.status(500).send({
                message: "Failed! No record found.",
                err
            });
        }
    },

    // Add a record to database.
    add: async (req, res, next) => {
        let newRecord = await ProjectRolesModel.findOne({ "key": 'acl' });
        if (!newRecord) {
            newRecord = new ProjectRolesModel(req.body);
            return res.send(await newRecord.save());
        } else {
            return next({ "message": "Model already exists, use add role api" });
        }
    },

    addDefaultProjectRoles: async (req, res, next) => {
        try {
            let body = req.body;
            let record = await ProjectRolesModel.findOne({ "key": 'acl' });
            if (!record) {
                try {
                    body.roles = getDefaultRolesData();
                    return res.send(await (new ProjectRolesModel(body)).save());
                } catch (err) {
                    return next({ message: 'Cannot add default roles 2', err });
                }
            } else {
                record._doc.message = 'Already added';
                return res.send(record);
            }
        } catch (err) {
            return next({ message: 'Cannot add default roles 1', err });
        }
    },

    addBulk: async (req, res, next) => {
        if (req.query.assignRoles) {
            req.body = req.body.map(model => {
                model.roles = getDefaultRolesData();
                return model;
            })
        }
        var promises = [];
        req.body.forEach(function (record) {
            promises.push(addPromise(record))
        });
        let bulkres = await Promise.all(promises)
        return res.send({ bulkres, roleModels: await ProjectRolesModel.find({}) });
    },

    addRole: async (req, res, next) => {
        let record = await ProjectRolesModel.findOne({ "key": 'acl' });
        if (record) {
            record.roles.push(req.body.role);
            return res.send(await record.save());
        } else {
            let body = {
                model: req.body.model,
                roles: [req.body.role]
            }
            newRecord = new ProjectRolesModel(body);
            return res.send(await newRecord.save());
        }
    },
    editRole: async (req, res, next) => {
        let obj = { "roles.$.name": req.body.name, "roles.$.description": req.body.description || '' };
        if (req.body.permissions) obj["roles.$.permissions"] = req.body.permissions;
        let record = await ProjectRolesModel.findOneAndUpdate({ "roles._id": req.params.id }, {
            $set: obj
        });
        if (record) {
            let response = await ProjectRolesModel.findOne({ "key": 'acl' });
            return res.send(response);
        } else {
            return next({ "message": "Record not found to add role" });
        }
    },
    deleteRole: async (req, res, next) => {
        let record = await ProjectRolesModel.update({ "roles._id": req.params.id }, { $pull: { roles: { _id: req.params.id } } });
        if (record) {
            return res.send(record);
        } else {
            return next({ "message": "Record not found to add role" });
        }
    },

    // Find one record from database and update.
    findOneAndUpdate: (req, res, next) => {
        ProjectRolesModel.findOneAndUpdate({ _id: req.params.id }, {
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
    delete: (req, res, next) => {
        ProjectRolesModel.deleteOne({ _id: req.params.id }).then(response => {
            res.send(response);
        }).catch(err => {
            res.status(500).send({
                message: "Failed! record cannot be deleted!"
            });
        });
    }
}

function addPromise(body) {
    return new Promise(async (resolve, reject) => {
        try {
            let record = await ProjectRolesModel.findOne({ "key": 'acl' });
            if (record) {
                return resolve({ message: "Ignoring as roles are already added" });
            } else {
                let payload = {
                    model: body.model,
                    roles: body.roles
                }
                newRecord = new ProjectRolesModel(payload);
                return resolve(await newRecord.save());
            }
        } catch (err) {
            reject(err);
        }
    })
}

function getDefaultRolesData() {
    let allPermissions = [
        { module: "team", name: "Add member", code: "member_add" },
        { module: "team", name: "Edit member", code: "member_edit" },
        { module: "team", name: "Delete member", code: "member_delete" },
        { module: "acl", name: "View ACL", code: "acl_view" },
        { module: "acl", name: "Add role", code: "role_add" },
        { module: "acl", name: "Edit role", code: "role_edit" },
        { module: "acl", name: "Delete role", code: "role_delete" },
        { module: "import", name: "Import Taiga", code: "import_taiga" },
        { module: "project", name: "Edit project", code: "project_edit" },
        { module: "project", name: "Delete project", code: "project_delete" },
        { module: "target", name: "Add target", code: "target_add" },
        { module: "target", name: "Edit target", code: "target_edit" },
        { module: "target", name: "Delete target", code: "target_delete" },
        { module: "task", name: "Add task", code: "task_add" },
        { module: "task", name: "Edit task", code: "task_edit" },
        { module: "task", name: "Delete task", code: "task_delete" },
        { name: "View all tasks", code: "tasks_view_all", module: 'task' },
        { module: "activity-logs", name: "View activity logs", code: "activity_logs_view" }
    ];
    let permissionSet1 = [
        { module: "task", code: "task_add", name: "Add task" },
        { module: "task", code: "task_edit", name: "Edit task" },
        { module: "task", name: "Delete task", code: "task_delete" },
        { module: "target", name: "Add target", code: "target_add" },
        { module: "target", name: "Edit target", code: "target_edit" },
        { module: "activity-logs", name: "View activity logs", code: "activity_logs_view" }
    ];
    return [
        {
            name: "Product Owner", permissions: allPermissions
        },
        {
            name: "Development Manager", permissions: allPermissions
        },
        {
            name: "Resource", permissions: permissionSet1
        },
        {
            name: "Back", permissions: permissionSet1
        },
        {
            name: "Front", permissions: permissionSet1
        },
        {
            name: "SQA", permissions: permissionSet1
        }
    ]
}