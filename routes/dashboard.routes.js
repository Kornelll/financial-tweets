var express = require('express');
var router = express.Router();

const authWare = require('../middlewares/auth.middleware');
const controller = require('../controllers/dashboard.controller');

router.route('/backup-db')
    .get(authWare.auth, authWare.allowMiddle({ codes: ['take_backup_db'] }), controller.takeBackup)

router.route('/send-bulk-notifications')
    .post(authWare.auth, authWare.allowMiddle({ codes: ['bulk_notifications_send'] }), controller.sendBulkNotifications)

module.exports = router;