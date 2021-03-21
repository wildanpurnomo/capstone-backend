const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { ErrorHandler } = require('../lib/error');
const usernameMinLength = 6
const passwordConfig = {
    passwordRegex: /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/,
    passwordMinLength: 8
}

const schema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "Username must be provided"],
        unique: true,
        trim: true,
        minlength: [usernameMinLength, `Username must be at least ${usernameMinLength} characters`]
    },
    password: {
        type: String,
        required: [true, "Password must be provided"],
        minlength: [passwordConfig.passwordMinLength, `Password must be at least ${passwordConfig.passwordMinLength} characters`],
        match: [passwordConfig.passwordRegex, "Password must contain at least one lowercase character, one uppercase character and one digit number"],
    }
});

schema.pre('save', async function (next) {
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

schema.statics.login = async function (username, password) {
    let user = await this.findOne({ username });
    if (user) {
        let isPasswordMatch = await bcrypt.compare(password, user.password);
        if (isPasswordMatch) {
            return user;
        } else {
            throw new ErrorHandler("Credential not match or user not found");
        }
    } else {
        throw new ErrorHandler("Credential not match or user not found");
    }
}

const UserModel = mongoose.model('user', schema);

module.exports = UserModel;