const { ErrorHandler } = require('../lib/error');
const BaseController = require('./baseController');
const { google } = require('googleapis');

class ClassroomController extends BaseController {
    constructor() {
        super();
        this.listCourses_get = this.listCourses_get.bind(this);
        this.listSubmission_get = this.listSubmission_get.bind(this);
    }

    async listCourses_get(req, res, next) {
        try {
            let decoded = this.verifyToken(req);
            if (decoded) {
                let oauth2Client = new google.auth.OAuth2(
                    process.env.GOOGLEAPIS_CLIENT_SECRET,
                    process.env.GOOGLEAPIS_CLIENT_ID,
                    `http://${req.headers.host}/api/auth/withgoogle`
                );
                let token = decoded.googleApisToken;
                oauth2Client.setCredentials(token);

                let classroom = google.classroom({ version: 'v1', auth: oauth2Client });
                let listCourseResponse = await classroom.courses.list();
                res.status(200).json(super.createSuccessResponse({ courseData: listCourseResponse.data.courses }));
            } else {
                throw new ErrorHandler("Session expired");
            }
        } catch (error) {
            super.logMessage("classroomController.js at listCourses_get", error);
            next(error);
        }
    }

    async listSubmission_get(req, res, next) {
        try {
            let decoded = this.verifyToken(req);
            if (decoded) {
                let oauth2Client = new google.auth.OAuth2(
                    process.env.GOOGLEAPIS_CLIENT_SECRET,
                    process.env.GOOGLEAPIS_CLIENT_ID,
                    `http://${req.headers.host}/api/auth/withgoogle`
                );
                let token = decoded.googleApisToken;
                oauth2Client.setCredentials(token);

                let { courseId } = super.decryptRequestBody(req.body);
                let classroom = google.classroom({ version: 'v1', auth: oauth2Client });
                let listSubmissionResponse = await classroom.courses.courseWork.studentSubmissions.list({
                    courseId: courseId,
                    courseWorkId: '-',
                });
                res.status(200).json(super.createSuccessResponse({ submissionData: listSubmissionResponse.data.studentSubmissions }));
            } else {
                throw new ErrorHandler("Session expired");
            }
        } catch (error) {
            super.logMessage("classroomController.js at listSubmission_get", error);
            next(error);
        }
    }
}

module.exports = new ClassroomController();