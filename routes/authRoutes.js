const { Router } = require('express');
const router = Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register_post);
router.post('/login', authController.login_post);

module.exports = router;