const jwt = require('jsonwebtoken');

class BaseController {
    constructor() {
        this.tokenMaxAge = 1 * 24 * 60 * 60;
        this.tokenSecret = process.env.EXPRESS_JWT_SECRET || 'masihsukadia';
    }

    createToken(id) {
        return jwt.sign({ id }, this.tokenSecret, {
            expiresIn: this.tokenMaxAge,
        });
    }
}

module.exports = BaseController;