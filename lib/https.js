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