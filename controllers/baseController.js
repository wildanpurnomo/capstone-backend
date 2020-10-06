const jwt = require('jsonwebtoken');
const { encryptData, decryptData } = require('../lib/https');

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

    createSuccessResponse(rawData) {
        return {
            status: 'Success',
            data: encryptData(rawData)
        }
    }

    createFailResponse(rawData) {
        return {
            status: 'Error',
            data: encryptData(rawData)
        }
    }

    decryptRequestBody(requestBody) {
        return decryptData(requestBody.payload);
    }
}

module.exports = BaseController;