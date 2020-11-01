const { Router } = require('express');
const router = Router();
const classroomController = require('../controllers/classroomController');

router.get('/classroom/courses', classroomController.listCourses_get);
router.get('/classroom/submissions', classroomController.listSubmission_get);

module.exports = router;