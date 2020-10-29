const { Router } = require('express');
const router = Router();
const bucketController = require('../controllers/bucketController');
const Multer = require('multer');
const multerInstance = Multer({
    storage: Multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

router.get('/documents', bucketController.fetchBucket_get);
router.post('/documents', multerInstance.fields([{ name: 'docs', maxCount: 20}]), bucketController.saveBucket_post);

module.exports = router;