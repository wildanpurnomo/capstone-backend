const jwt = require('jsonwebtoken');
const { logIfDebug } = require('../lib/logger');

class BaseController {
    constructor() {
        this.tokenSecret = process.env.EXPRESS_JWT_SECRET || 'masihsukadia';
    }

    createToken(id) {
        return jwt.sign({ id }, this.tokenSecret);
    }

    createTokenGoogleLogin(id, googleApisToken) {
        return jwt.sign({ id, googleApisToken }, this.tokenSecret);
    }

    verifyToken(req) {
        let token = req.cookies.jwt;
        let decoded = jwt.verify(token, this.tokenSecret);
        return decoded;
    }

    generateCookieOption(isLogout = false) {
        let cookieOption = {
            httpOnly: true
        }

        if (isLogout) {
            cookieOption.maxAge = 1;
        }

        if (process.env.IS_USING_HTTPS) {
            cookieOption.secure = true;
            cookieOption.sameSite = 'none';
        }

        return cookieOption
    }

    createSuccessResponse(rawData) {
        return {
            status: 'Success',
            data: rawData
        }
    }

    logMessage(message, error) {
        logIfDebug(message, error);
    }
}

module.exports = BaseController;