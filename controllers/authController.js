const { ErrorHandler } = require('../lib/error');
const UserModel = require('../models/UserModel');
const BaseController = require('./baseController');
const { google } = require('googleapis');

class AuthController extends BaseController {
    constructor() {
        super();
        this.register_post = this.register_post.bind(this);
        this.login_post = this.login_post.bind(this);
        this.authenticate_get = this.authenticate_get.bind(this);
        this.processOauth_get = this.processOauth_get.bind(this);
        this.getGoogleAuthUrl_get = this.getGoogleAuthUrl_get.bind(this);
    }

    async register_post(req, res, next) {
        try {
            let { username, email, password } = super.decryptRequestBody(req.body);
            let user = await UserModel.create({ username: username.trim(), email: email.trim(), password });
            if (user) {
                let token = super.createToken(user._id);
                user.password = undefined;
                res.cookie('jwt', token, { httpOnly: true, maxAge: this.tokenMaxAge * 1000, secure: true, sameSite: 'none' });
                res.status(200).json(super.createSuccessResponse({ userData: user }));
            }
        } catch (error) {
            super.logMessage("authController.js at register_post", error);
            next(error);
        }
    }

    async login_post(req, res, next) {
        try {
            let requestBody = super.decryptRequestBody(req.body);
            let user = await UserModel.login(requestBody.username.trim(), requestBody.password);
            let token = this.createToken(user._id);
            user.password = undefined;
            res.cookie('jwt', token, { httpOnly: true, maxAge: this.tokenMaxAge * 1000, secure: true, sameSite: 'none' });
            res.status(200).json(super.createSuccessResponse({ userData: user }));
        } catch (error) {
            super.logMessage("authController.js at login_post", error);
            next(error);
        }
    }

    getGoogleAuthUrl_get(req, res, _) {
        try {
            let decoded = this.verifyToken(req);
            if (decoded) {
                let scopes = [
                    'https://www.googleapis.com/auth/classroom.rosters.readonly',
                    'https://www.googleapis.com/auth/classroom.courses.readonly',
                    'https://www.googleapis.com/auth/classroom.coursework.students.readonly'
                ];
                let oauth2Client = new google.auth.OAuth2(
                    process.env.GOOGLEAPIS_CLIENT_SECRET,
                    process.env.GOOGLEAPIS_CLIENT_ID,
                    `http://${req.headers.host}/api/auth/withgoogle`
                );
                let authUrl = oauth2Client.generateAuthUrl({
                    access_type: 'offline',
                    scope: scopes,
                });

                res.status(200).json(super.createSuccessResponse({ authUrl }));
            } else {
                throw new ErrorHandler("Session expired");
            }
        } catch (error) {
            super.logMessage("authController.js at getGoogleAuthUrl_get", error);
            next(error);
        }
    }

    async processOauth_get(req, res, next) {
        try {
            let oauth2Client = new google.auth.OAuth2(
                process.env.GOOGLEAPIS_CLIENT_SECRET,
                process.env.GOOGLEAPIS_CLIENT_ID,
                `http://${req.headers.host}/api/auth/withgoogle`
            );
            let code = req.query.code;
            let googleApisToken = await oauth2Client.getToken(code);
            oauth2Client.setCredentials(googleApisToken.tokens);

            let classroom = google.classroom({ version: 'v1', auth: oauth2Client });
            let userProfileResponse = await classroom.userProfiles.get({ userId: 'me' });
            let jwtToken = super.createTokenGoogleLogin(userProfileResponse.data.id, googleApisToken.tokens);

            res.cookie('jwt', jwtToken, { httpOnly: true, maxAge: this.tokenMaxAge * 1000, secure: true, sameSite: 'none' });
            res.redirect(`http://${req.headers.host}/main`);
        } catch (error) {
            super.logMessage("authController at processOauth_get", error);
            next(error);
        }
    }

    logout_post(_, res) {
        res.clearCookie('jwt');
        res.status(200).json(super.createSuccessResponse({ message: 'Successfully logged user out' }));
    }

    async authenticate_get(req, res, next) {
        try {
            let decoded = this.verifyToken(req);
            if (decoded) {
                if (decoded.googleApisToken) {
                    let oauth2Client = new google.auth.OAuth2(
                        process.env.GOOGLEAPIS_CLIENT_SECRET,
                        process.env.GOOGLEAPIS_CLIENT_ID,
                        `http://${req.headers.host}/api/auth/withgoogle`
                    );
                    oauth2Client.setCredentials(decoded.googleApisToken);

                    let classroom = google.classroom({ version: 'v1', auth: oauth2Client });
                    let userProfileResponse = await classroom.userProfiles.get({ userId: 'me' });
                    res.status(200).json(super.createSuccessResponse({ userData: userProfileResponse.data }));
                } else {
                    let user = await UserModel.findById(decoded.id);
                    user.password = undefined;
                    res.status(200).json(super.createSuccessResponse({ userData: user }));
                }
            } else {
                throw new ErrorHandler("Session expired");
            }
        } catch (error) {
            super.logMessage("authController at authenticate_get", error);
            next(error);
        }
    }
}

module.exports = new AuthController();