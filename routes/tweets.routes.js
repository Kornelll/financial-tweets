var express = require('express');
var router = express.Router();

const authWare = require('../middlewares/auth.middleware');
const controller = require('../controllers/tweets.controller');

router.route('/')
    .get(controller.list)
    .post(authWare.auth, authWare.allowMiddle({ codes: ['manage_tweets'] }), controller.add);

router.route('/bulk-post')
    .post(authWare.auth, authWare.allowMiddle({ codes: ['manage_tweets'] }), controller.addBulk);

router.route('/:id')
    .get(authWare.auth, controller.findOne)


router.route('/:id')
    .put(authWare.auth, authWare.allowMiddle({ codes: ['manage_tweets'] }), controller.findOneAndUpdate)
    .delete(authWare.auth, authWare.allowMiddle({ codes: ['manage_tweets'] }), controller.delete)


module.exports = router;