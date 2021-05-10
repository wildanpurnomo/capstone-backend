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
        this.logout_post = this.logout_post.bind(this);
    }

    async register_post(req, res, next) {
        try {
            let { username, password } = req.body;
            let user = await UserModel.create({ username: username.trim(), password: password });
            if (user) {
                let token = super.createToken(user._id);
                user._id = undefined
                user.password = undefined;
                user.isUsingGoogleAuth = false;
                res.cookie('jwt', token, super.generateCookieOption());
                res.status(200).json(super.createSuccessResponse({ userData: user }));
            }
        } catch (error) {
            super.logMessage("authController.js at register_post", error);
            next(error);
        }
    }

    async login_post(req, res, next) {
        try {
            let { username, password } = req.body;
            let user = await UserModel.login(username.trim(), password);
            let token = this.createToken(user._id);
            user._id = undefined;
            user.password = undefined;
            user.isUsingGoogleAuth = false;
            res.cookie('jwt', token, super.generateCookieOption());
            res.status(200).json(super.createSuccessResponse({ userData: user }));
        } catch (error) {
            super.logMessage("authController.js at login_post", error);
            next(error);
        }
    }

    getGoogleAuthUrl_get(req, res, next) {
        let scopes = [
            'https://www.googleapis.com/auth/classroom.rosters.readonly',
            'https://www.googleapis.com/auth/classroom.courses.readonly',
            'https://www.googleapis.com/auth/classroom.coursework.students.readonly'
        ];
        let redirectUrl = req.headers.host.includes("localhost") ? `http://${req.headers.host}/api/auth/withgoogle` : `https://${req.headers.host}/api/auth/withgoogle`
        let oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLEAPIS_CLIENT_SECRET,
            process.env.GOOGLEAPIS_CLIENT_ID,
            redirectUrl
        );
        let authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
        });

        res.status(200).json(super.createSuccessResponse({ authUrl }));
    }

    async processOauth_get(req, res, next) {
        try {
            let redirectUrl = req.headers.host.includes("localhost") ? `http://${req.headers.host}/api/auth/withgoogle` : `https://${req.headers.host}/api/auth/withgoogle`
            let oauth2Client = new google.auth.OAuth2(
                process.env.GOOGLEAPIS_CLIENT_SECRET,
                process.env.GOOGLEAPIS_CLIENT_ID,
                redirectUrl
            );
            let code = req.query.code;
            let googleApisToken = await oauth2Client.getToken(code);
            oauth2Client.setCredentials(googleApisToken.tokens);

            let classroom = google.classroom({ version: 'v1', auth: oauth2Client });
            let userProfileResponse = await classroom.userProfiles.get({ userId: 'me' });
            let jwtToken = super.createTokenGoogleLogin(userProfileResponse.data.id, googleApisToken.tokens);

            res.cookie('jwt', jwtToken, super.generateCookieOption());
            res.redirect(`https://${req.headers.host}/main`);
        } catch (error) {
            super.logMessage("authController at processOauth_get", error);
            next(error);
        }
    }

    logout_post(req, res) {
        try {
            res.cookie('jwt', '', super.generateCookieOption({ isLogout: true }));
            res.status(200).json(super.createSuccessResponse({ message: 'Successfully logged user out' }));
        } catch (error) {
            super.logMessage("authController at logout_post", error);
            next(error);
        }

    }

    async authenticate_get(req, res, next) {
        try {
            let decoded = this.verifyToken(req);
            if (decoded) {
                if (decoded.googleApisToken) {
                    let redirectUrl = req.headers.host.includes("localhost") ? `http://${req.headers.host}/api/auth/withgoogle` : `https://${req.headers.host}/api/auth/withgoogle`
                    let oauth2Client = new google.auth.OAuth2(
                        process.env.GOOGLEAPIS_CLIENT_SECRET,
                        process.env.GOOGLEAPIS_CLIENT_ID,
                        redirectUrl
                    );
                    oauth2Client.setCredentials(decoded.googleApisToken);

                    let classroom = google.classroom({ version: 'v1', auth: oauth2Client });
                    let userProfileResponse = await classroom.userProfiles.get({ userId: 'me' });
                    let userProfile = userProfileResponse.data;
                    res.status(200).json(super.createSuccessResponse({ userData: { 
                        username: userProfile.name.fullName,
                        isUsingGoogleAuth: true,
                    } }));
                } else {
                    let user = await UserModel.findById(decoded.id);
                    user._id = undefined
                    user.password = undefined;
                    user.isUsingGoogleAuth = false;
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