var express = require('express');
var router = express.Router();

const authWare = require('../middlewares/auth.middleware');
const personal_info = require('../controllers/users.controller');

router.route('/')
    .get(authWare.auth, personal_info.list)
    .post(authWare.auth, personal_info.add);

router.route('/bulk')
    .post(personal_info.addBulk);

router.route('/change-password')
    .post(authWare.auth, personal_info.changePassword);

router.route('/login')
    .get((req, res) => {
        res.json({
            "message": 'login api endpoint'
        });
    })
    .post(personal_info.login)
    .delete(personal_info.logout);

router.route('/login/activation')
    .post(personal_info.activateEmail)

router.route('/configurations/:id')
    .post(authWare.auth, authWare.allowMiddle({ codes: ['user_view_all', 'user_edit'] }, { userFieldType: 'params', userField: 'id', codes: ['member_edit'], ignoreCodesIfSameUser: true }), personal_info.saveConfigurations)

router.route('/:id')
    .get(authWare.auth, authWare.allowMiddle({ codes: ['user_view_all'] }, { userFieldType: 'params', userField: 'id' }), personal_info.findOne)


router.route('/:id')
    .put(authWare.auth, authWare.allowMiddle({ codes: ['user_view_all', 'user_edit'] }, { userFieldType: 'params', userField: 'id', codes: ['member_edit'], ignoreCodesIfSameUser: true }), personal_info.findOneAndUpdate)
    .delete(authWare.auth, authWare.allowMiddle({ codes: ['user_view_all', 'user_delete'], logic: 'or' }, { userFieldType: 'params', userField: 'id', codes: ['member_delete'] }), personal_info.delete)

router.route('/emails/all')
    .get(personal_info.findByEmail)

module.exports = router;