const { ErrorHandler } = require('../lib/error');
const BaseController = require('./baseController');
const spawn = require('child_process').spawn;
const path = require('path');
const axios = require('axios');

class AnalyticsController extends BaseController {
    constructor() {
        super();
        this.processDocuments_post = this.processDocuments_post.bind(this);
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
                    let result = {
                        pair: response.data.Pair,
                        substring: response.data.Substring,
                        similarity: response.data.Similarity
                    }
                    res.status(200).json(super.createSuccessResponse(result));
                }
            } else {
                throw new ErrorHandler("Session expired");
            }
        } catch (error) {
            super.logMessage("analyticsController.js at processDocumentsV2_post", error);
            next(error);
        }
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