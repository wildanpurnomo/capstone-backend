const mongoose = require('mongoose');
const { ErrorHandler } = require('../lib/error');

const schema = new mongoose.Schema({
    creatorId: {
        type: String,
        required: [true, "Creator must be provided"]
    },
    folderName: {
        type: String,
        trim: true,
        required: [true, "Folder name must be provided"],
    },
}, { timestamps: true });

schema.statics.add = async function (data) {
    try {
        let folderList = await this.find({ creatorId: data.creatorId });
        let filtered = folderList.filter(folder => {
            return folder.folderName === data.folderName;
        });
        if (filtered.length === 0) {
            let folder = await this.create(data);
            return folder;
        } else {
            throw new ErrorHandler("User has already own folder with same name");
        }
    } catch (error) {
        throw error;
    }
}

const FolderModel = mongoose.model('folder', schema);

module.exports = FolderModel;