const express = require('express');
const router = express.Router();


const personal_info = require('../controllers/users.controller.js');


router.route('/')
    .get((req, res) => {
        res.json({
            "message": 'login api endpoint'
        });
    })
    .post(personal_info.login)

router.route('/:userId')
    .put(personal_info.logout);

router.route('/register')
    .post(personal_info.add);

router.route('/forgot-password')
    .post(personal_info.forgotPassword);

router.route('/reset-password')
    .post(personal_info.resetPassword);

router.route('/resend-code')
    .post(personal_info.resendActivationCode)

router.route('/activation')
    .post(personal_info.activateEmail)

router.route('/activate-account')
    .post(personal_info.activateAccount)


module.exports = router;