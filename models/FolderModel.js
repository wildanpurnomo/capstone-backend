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
    folderSlug: {
        type: String,
        trim: true,
        required: [true, "Folder slug must be provided"],
    }
}, { timestamps: true });

schema.statics.add = async function (data) {
    try {
        let folderList = await this.find({ creatorId: data.creatorId });
        let filtered = folderList.filter(folder => {
            return folder.folderName === data.folderName;
        });
        if (filtered.length === 0) {
            data.folderSlug = data.folderName.trim().replace(/\s+/g, '-').toLowerCase() + `-${data.creatorId}`;
            return await this.create(data);
        } else {
            throw new ErrorHandler("Anda telah memiliki folder dengan nama tersebut");
        }
    } catch (error) {
        throw error;
    }
}

schema.statics.alter = async function (creatorId, folderId, updateBody) {
    try {
        updateBody.folderSlug = updateBody.folderName.trim().replace(/\s+/g, '-').toLowerCase() + `-${creatorId}`;
        return await this.findOneAndUpdate({ _id: folderId }, updateBody, { new: true });
    } catch (error) {
        throw error;
    }
}

const FolderModel = mongoose.model('folder', schema);

module.exports = FolderModel;