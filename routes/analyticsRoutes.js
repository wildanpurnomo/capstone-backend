const { Router } = require('express');
const router = Router();
const analyticsController = require('../controllers/analyticsController');

router.post('/analytics', analyticsController.processDocuments_post);
router.post('/analytics/v2', analyticsController.processDocumentsV2_post);
router.get('/analytic-result/:folderSlug', analyticsController.getAnalyticResult_get);

module.exports = router;