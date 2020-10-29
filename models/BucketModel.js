const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    creatorId: {
        type: String,
        required: [true, "creatorId must be provided"],
    },
    folderId: {
        type: String,
        required: [true, "folderId must be provided"],
    },
    documentUrl: {
        type: String,
        required: [true, "documentUrl must be provided"],
    },
    documentType: {
        type: String,
        required: [true, "documentType must be provided"],
    },
    documentOriginalName: {
        type: String,
        required: [true, "documentOriginalName must be provided"]
    }
}, { timestamps: true });

const BucketModel = mongoose.model('bucket', schema);

module.exports = BucketModel;