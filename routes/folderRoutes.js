const { Router } = require('express');
const router = Router();
const folderController = require('../controllers/folderController');

router.get('/folder', folderController.fetchByUserId_get);
router.post('/folder', folderController.addFolder_post);
router.put('/folder/:folderId', folderController.editFolder_put);
router.delete('/folder/:folderId', folderController.deleteFolder_delete);

module.exports = router;