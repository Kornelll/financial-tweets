var express = require('express');
var router = express.Router();
const attach = require('../utils/upload/upload');

const authWare = require('../middlewares/auth.middleware');
const controller = require('../controllers/documents.controller.js');
//
router.route('/')
    .get(authWare.auth, controller.list)
router.route('/upload/:model/:id')
    .post(authWare.auth, attach.uploadEodDoc.any(), controller.uploadDocument);

router.route('/download/:id')
    .get(controller.download);

router.route('/:id')
    .get(authWare.auth, controller.findOne)
    .put(authWare.auth, controller.findOneAndUpdate)
    .delete(authWare.auth, authWare.allowMiddle({ codes: ['files_delete'] }, { codes: ['files_delete'] }), controller.delete)

router.route('/user/:employeeId')
    .get(authWare.auth, controller.getByUser);

module.exports = router;