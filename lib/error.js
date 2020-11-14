class ErrorHandler extends Error {
    constructor(message) {
        super();
        this.message = message;
    }
}

const handleError = (err, req, res) => {
    let message = processErrorMessage(err);

    res.status(400).json({
        status: 'Error',
        data: { message }
    });
}

processErrorMessage = (err) => {
    console.error(err);
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