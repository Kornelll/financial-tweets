var express = require('express');
var router = express.Router();

const authWare = require('../middlewares/auth.middleware');
const controller = require('../controllers/release-notes.controller');

router.route('/')
    .get(authWare.auth, controller.list)
    .post(authWare.auth, authWare.allowMiddle({ codes: ['release_add'] }), controller.add);

router.route('/latest')
    .get(authWare.auth, controller.getLatest)

router.route('/:id')
    .get(authWare.auth, controller.findOne)


router.route('/:id')
    .put(authWare.auth, authWare.allowMiddle({ codes: ['release_edit'] }), controller.findOneAndUpdate)
    .delete(authWare.auth, authWare.allowMiddle({ codes: ['release_delete'] }), controller.delete)


module.exports = router;