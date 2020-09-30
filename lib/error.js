class ErrorHandler extends Error {
    constructor(statusCode, message) {
        super();
        this.statusCode = statusCode;
        this.message = message;
    }
}

const DEFAULT_STATUS_CODE = 400;

const handleError = (err, res) => {
    let { statusCode } = err;
    if (!statusCode) {
        statusCode = DEFAULT_STATUS_CODE;
    }

    let message = processErrorMessage(err);

    res.status(statusCode).json({
        status: "Error",
        statusCode,
        message
    });
}

processErrorMessage = (err) => {
    if (err.code === 11000) {
        return err.message.includes("email") ? "Email has been used" : "Username has been used";
    } else {
        return err.message;
    }
}

module.exports = {
    ErrorHandler,
    handleError
}