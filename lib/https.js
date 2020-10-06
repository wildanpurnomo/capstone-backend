const crypto = require('crypto-js');
const key = process.env.EXPRESS_CRYPTO_KEY;

module.exports.redirectToSecure = (req, res, next) => {
    let env = process.env.EXPRESS_ENV || 'sandbox';
    let isLocalhost = env === 'sandbox';
    let isSecure = req.headers['x-forwarded-proto'] === 'https';
    if (!isSecure && !isLocalhost) {
        let secureUrl = `https://${req.headers.host}${req.url}`;
        res.redirect(secureUrl);
    } else {
        next();
    }
}

module.exports.encryptData = (jsonData) => {
    return crypto.AES.encrypt(JSON.stringify(jsonData), key).toString();
}

module.exports.decryptData = (encrypted) => {
    let bytes = crypto.AES.decrypt(encrypted, key);
    return JSON.parse(crypto.enc.Utf8.stringify(bytes));
}