const { Router } = require('express');
const router = Router();
const classroomController = require('../controllers/classroomController');

router.get('/classroom/courses', classroomController.listCourses_get);
router.get('/classroom/submissions/:courseId/:courseWorkId', classroomController.listSubmission_get);
router.get('/classroom/courseworks/:courseId', classroomController.listCourseWork_get);

module.exports = router;