const mongoose = require('mongoose');

const analyticSchema = new mongoose.Schema({
    clusterMin: String,
    clusterMax: String,
    pairingCount: Number,
    clusterPairIndex: Array,
    clusterSimilarities: Array,
    clusterSubstrings: Array
});

const analyticResultSchema = new mongoose.Schema({
    folderId: {
        type: String,
        required: [true, "folderId must be provided"],
    },
    result: {
        type: [analyticSchema],
        required: [true, "result must be provided"]
    }
}, { timestamps: true });

const AnalyticResultModel = mongoose.model('analytic', analyticResultSchema);

module.exports = AnalyticResultModel;