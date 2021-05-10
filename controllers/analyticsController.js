const { ErrorHandler } = require('../lib/error');
const BaseController = require('./baseController');
const axios = require('axios');
const AnalyticResultModel = require('../models/AnalyticResultModel');
const FolderModel = require('../models/FolderModel');

class AnalyticsController extends BaseController {
    constructor() {
        super();
        this.processDocuments_post = this.processDocuments_post.bind(this);
        this.processDocumentsV2_post = this.processDocumentsV2_post.bind(this);
        this.getAnalyticResult_get = this.getAnalyticResult_get.bind(this);
    }

    async getAnalyticResult_get(req, res, next) {
        try {
            let decoded = this.verifyToken(req);
            if (decoded) {
                let folder = await FolderModel.findOne({
                    creatorId: decoded.id,
                    folderSlug: req.params.folderSlug + `-${decoded.id}`
                });

                res.status(200).json(super.createSuccessResponse(
                    await AnalyticResultModel.findOne({
                        creatorId: decoded.id,
                        folderId: folder._id
                    })));
            } else {
                throw new ErrorHandler("Session expired");
            }
        } catch (error) {
            super.logMessage("analyticsController.js at getAnalyticResult_get", error);
            next(error);
        }
    }

    async processDocuments_post(req, res, next) {
        try {
            let decoded = this.verifyToken(req);
            if (decoded) {
                this.validateClientInput(req.body.documents, 1.0);

                let requestBody = {
                    similarity: 0.0,
                    URLlist: req.body.documents
                };

                let response = await axios.post(process.env.AI_SERVICE, requestBody);
                if (response.status === 200) {
                    let result = this.clusterizedAnalyticResponse(response.data);
                    res.status(200).json(super.createSuccessResponse(result));
                }
            } else {
                throw new ErrorHandler("Session expired");
            }
        } catch (error) {
            super.logMessage("analyticsController.js at processDocuments_post", error);
            next(error);
        }
    }

    async processDocumentsV2_post(req, res, next) {
        try {
            let decoded = this.verifyToken(req);
            if (decoded) {
                this.validateClientInput(req.body.documents, 1.0);

                let analyticResult = await AnalyticResultModel.findOne({
                    creatorId: decoded.id,
                    folderId: req.body.folderId
                });

                if (analyticResult !== null && JSON.stringify(analyticResult.documentUrls) === JSON.stringify(req.body.documents)) {
                    res.status(200).json(super.createSuccessResponse({ result: analyticResult.result }));
                    return;
                }

                let requestBody = {
                    similarity: 0.0,
                    URLlist: req.body.documents
                };
                let response = await axios.post(process.env.AI_SERVICE, requestBody);
                if (response.status === 200) {
                    let clusterizedResult = this.clusterizedAnalyticResponse(response.data);
                    let stored = {
                        creatorId: decoded.id,
                        folderId: req.body.folderId,
                        documentUrls: req.body.documents,
                        result: clusterizedResult
                    }
                    AnalyticResultModel.findOneAndUpdate(
                        { creatorId: decoded.id, folderId: req.body.folderId },
                        stored,
                        { upsert: true, new: true, setDefaultOnInsert: true },
                    ).exec();
                    res.status(200).json(super.createSuccessResponse({ result: clusterizedResult }));
                }
            } else {
                throw new ErrorHandler("Session expired");
            }
        } catch (error) {
            super.logMessage("analyticsController.js at processDocumentsV2_post", error);
            next(error);
        }
    }

    clusterizedAnalyticResponse(rawResponse) {
        let clusterized = [
            {
                clusterMin: "0%",
                clusterMax: "25%",
                pairingCount: 0,
                clusterPairIndex: [],
                clusterSimilarities: [],
                clusterSubstrings: [],
            },
            {
                clusterMin: "25%",
                clusterMax: "50%",
                pairingCount: 0,
                clusterPairIndex: [],
                clusterSimilarities: [],
                clusterSubstrings: [],
            },
            {
                clusterMin: "50%",
                clusterMax: "75%",
                pairingCount: 0,
                clusterPairIndex: [],
                clusterSimilarities: [],
                clusterSubstrings: [],
            },
            {
                clusterMin: "75%",
                clusterMax: "100%",
                pairingCount: 0,
                clusterPairIndex: [],
                clusterSimilarities: [],
                clusterSubstrings: [],
            }
        ];

        rawResponse.Similarity.forEach((item, index) => {
            let x = Math.round(parseFloat(item) * 100) / 100;
            if (x <= 0.25) {
                clusterized[0].pairingCount += 1;
                clusterized[0].clusterPairIndex.push(rawResponse.Pair[index]);
                clusterized[0].clusterSubstrings.push(rawResponse.Substring[index]);
                clusterized[0].clusterSimilarities.push(item);
            } else if (x > 0.25 && x <= 0.50) {
                clusterized[1].pairingCount += 1;
                clusterized[1].clusterPairIndex.push(rawResponse.Pair[index]);
                clusterized[1].clusterSubstrings.push(rawResponse.Substring[index]);
                clusterized[1].clusterSimilarities.push(item);
            } else if (x > 0.50 && x <= 0.75) {
                clusterized[2].pairingCount += 1;
                clusterized[2].clusterPairIndex.push(rawResponse.Pair[index]);
                clusterized[2].clusterSubstrings.push(rawResponse.Substring[index]);
                clusterized[2].clusterSimilarities.push(item);
            } else {
                clusterized[3].pairingCount += 1;
                clusterized[3].clusterPairIndex.push(rawResponse.Pair[index]);
                clusterized[3].clusterSubstrings.push(rawResponse.Substring[index]);
                clusterized[3].clusterSimilarities.push(item);
            }
        });

        return clusterized;
    }

    validateClientInput(documents, threshold) {
        if (!documents) {
            throw new ErrorHandler("documents must be provided");
        } else if (!threshold) {
            throw new ErrorHandler("threshold must be provided");
        } else if (documents.length < 2) {
            throw new ErrorHandler("documents must have at least 2 items");
        }
    }
}

module.exports = new AnalyticsController();