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

    verifyToken(req) {
        let token = req.cookies.jwt;
        let decoded = jwt.verify(token, this.tokenSecret);
        if (decoded.name) req.payloadName = decoded.name;
        return decoded;
    }

    createSuccessResponse(rawData) {
        return {
            status: 'Success',
            data: this.payloadName ? rawData : encryptData(rawData)
        }
    }

    createFailResponse(rawData) {
        return {
            status: 'Error',
            data: this.payloadName ? rawData : encryptData(rawData)
        }
    }

    decryptRequestBody(requestBody) {
        this.payloadName = "tes";
        return this.payloadName ? requestBody : decryptData(requestBody.payload);
    }
}

module.exports = BaseController;