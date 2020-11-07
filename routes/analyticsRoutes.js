const { Router } = require('express');
const router = Router();
const analyticsController = require('../controllers/analyticsController');

router.post('/analytics', analyticsController.processDocuments_post);

module.exports = router;