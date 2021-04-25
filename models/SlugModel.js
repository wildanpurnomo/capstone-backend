const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    folderSlug: {
        type: String,
        trim: true,
        unique: true,
        required: [true, "Folder Slug must be provided"]
    },
    folderId: {
        type: String,
        trim: true,
        ref: 'Folder',
        unique: true,
        required: [true, "Folder id must be provided"],
    },
}, { timestamps: true });

const SlugModel = mongoose.model('slug', schema);

module.exports = SlugModel;