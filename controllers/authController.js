const { ErrorHandler } = require('../lib/error');
const { logIfDebug } = require('../lib/logger');
const UserModel = require('../models/UserModel');
const BaseController = require('./baseController');

class AuthController extends BaseController {
    constructor() {
        super();
        this.register_post = this.register_post.bind(this);
        this.login_post = this.login_post.bind(this);
        this.authenticate_get = this.authenticate_get.bind(this);
    }

    async register_post(req, res, next) {
        try {
            let origin = req.headers['origin'];
            let { username, email, password } = super.decryptRequestBody(req.body);
            let user = await UserModel.create({ username: username.trim(), email: email.trim(), password });
            if (user) {
                let token = super.createToken(user._id);
                user.password = undefined;
                res.cookie('jwt', token, { httpOnly: true, maxAge: this.tokenMaxAge * 1000, secure: true, sameSite: 'none' });
                res.status(200).json(super.createSuccessResponse({ userData: user }));
            }
        } catch (error) {
            logIfDebug("authController.js at register_post", error);
            next(error);    
        }
    }

    async login_post(req, res, next) {
        try {
            let origin = req.headers['origin'];
            let requestBody = super.decryptRequestBody(req.body);
            let user = await UserModel.login(requestBody.username.trim(), requestBody.password);
            let token = this.createToken(user._id);
            user.password = undefined;
            res.cookie('jwt', token, { httpOnly: true, maxAge: this.tokenMaxAge * 1000, secure: true, sameSite: 'none' });
            res.status(200).json(super.createSuccessResponse({ userData: user }));
        } catch (error) {
            logIfDebug("authController.js at login_post", error);
            next(error);
        }
    }

    logout_post(req, res) {
        res.clearCookie('jwt');
        res.status(200).json(super.createSuccessResponse({ message: 'Successfully logged user out' }));
    }

    async authenticate_get(req, res, next) {
        try {
            let decoded = this.verifyToken(req);
            if (decoded) {
                let user = await UserModel.findById(decoded.id);
                user.password = undefined;
                res.status(200).json(super.createSuccessResponse({ userData: user }));
            } else {
                throw new ErrorHandler("Session expired");
            }
        } catch (error) {
            logIfDebug("authController at authenticate_get", error);
            next(error);
        }
    }
}

module.exports = new AuthController();