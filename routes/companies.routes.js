var express = require('express');
var router = express.Router();

const authWare = require('../middlewares/auth.middleware');
const controller = require('../controllers/companies.controller');

router.route('/')
    .get(authWare.auth, controller.list)
    .post(authWare.auth, authWare.allowMiddle({ codes: ['manage_companies'] }), controller.add);

router.route('/:id')
    .get(authWare.auth, controller.findOne)


router.route('/:id')
    .put(authWare.auth, authWare.allowMiddle({ codes: ['manage_companies'] }), controller.findOneAndUpdate)
    .delete(authWare.auth, authWare.allowMiddle({ codes: ['manage_companies'] }), controller.delete)


module.exports = router;