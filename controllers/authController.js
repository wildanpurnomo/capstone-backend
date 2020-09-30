const { logIfDebug } = require('../lib/logger');
const UserModel = require('../models/UserModel');
const BaseController = require('./baseController');

class AuthController extends BaseController {
    constructor() {
        super();
        this.register_post = this.register_post.bind(this);
        this.login_post = this.login_post.bind(this);
    }

    async register_post(req, res, next) {
        try {
            let { username, email, password } = req.body
            let user = await UserModel.create({ username: username.trim(), email: email.trim(), password });
            if (user) {
                let token = super.createToken(user._id);
                user.password = undefined;
                res.cookie('jwt', token, { httpOnly: true, maxAge: this.tokenMaxAge * 1000 });
                res.status(200).json({ userData: user });
            }
        } catch (error) {
            logIfDebug("authController.js", 23, error);
            next(error);
        }
    }

    async login_post(req, res, next) {
        try {
            let user = await UserModel.login(req.body.username.trim(), req.body.password);
            let token = this.createToken(user._id);
            user.password = undefined;
            res.cookie('jwt', token, { httpOnly: true, maxAge: this.tokenMaxAge * 1000 });
            res.status(200).json({ userData: user });
        } catch (error) {
            logIfDebug("authController.js", 36, error);
            next(error);
        }
    }
}

module.exports = new AuthController();