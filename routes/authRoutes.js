const { Router } = require('express');
const router = Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register_post);
router.post('/login', authController.login_post);
router.post('/logout', authController.logout_post);
router.get('/authenticate', authController.authenticate_get);
router.get('/auth/oauth_url', authController.getGoogleAuthUrl_get);
router.get('/auth/withgoogle', authController.processOauth_get);

module.exports = router;