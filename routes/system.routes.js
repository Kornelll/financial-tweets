var express = require('express');
var router = express.Router();

const authWare = require('../middlewares/auth.middleware');
const projectsController = require('../controllers/system.acl.controller');

router.route('/')
    .get(projectsController.list)
    .post(authWare.auth, projectsController.add);

router.route('/bulk')
    .post(projectsController.addBulk);

router.route('/default-roles')
    .post(authWare.auth, projectsController.addDefaultProjectRoles);

router.route('/role')
    .post(authWare.auth, authWare.allowMiddle({ codes: ['role_add'] }), projectsController.addRole);
router.route('/role/:id')
    .get(projectsController.findByRoleId)
    .put(authWare.auth, authWare.allowMiddle({ codes: ['role_edit'] }), projectsController.editRole)

router.route('/role/:id/:model')
    .delete(authWare.auth, authWare.allowMiddle({ codes: ['role_delete'] }), projectsController.deleteRole);

router.route('/getByKey/:key')
    .get(authWare.auth, authWare.allowMiddle({ codes: ['acl_view', 'user_view_all'], logic: 'or' }), projectsController.listByKey)

router.route('/:id')
    .get(projectsController.findOne)
    .put(authWare.auth, authWare.allowMiddle({ codes: ['user_view_all'] }), projectsController.findOneAndUpdate)
    .delete(authWare.auth, authWare.allowMiddle({ codes: ['user_view_all'] }), projectsController.delete)


module.exports = router;