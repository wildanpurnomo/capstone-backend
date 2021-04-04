const { ErrorHandler } = require('../lib/error');
const BaseController = require('./baseController');
const axios = require('axios');
const EPSILON = 0.00000000000000000001;

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
                    let result = this.clusterizedAnalyticResponse(response.data);
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
            let x = Math.round(parseFloat(item) * 100 ) / 100;
            console.log(0.0 <= x <= 0.25)
            if (x <= 0.25) {
                clusterized[0].pairingCount += 1;
                clusterized[0].clusterPairIndex.push(rawResponse.Pair[index]);
                clusterized[0].clusterSubstrings.push(rawResponse.Substring[index]);
                clusterized[0].clusterSimilarities.push(item);
            } else if (0.25 < x <= 0.50) {
                clusterized[1].pairingCount += 1;
                clusterized[1].clusterPairIndex.push(rawResponse.Pair[index]);
                clusterized[1].clusterSubstrings.push(rawResponse.Substring[index]);
                clusterized[1].clusterSimilarities.push(item);
            } else if (0.50 < x <= 0.75) {
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

    isALessThanB(A, B) {
		return (A - B < EPSILON) && (Math.abs(A - B) > EPSILON);
	};

	isAMoreThanB(A, B) {
		return (A - B > EPSILON) && (Math.abs(A - B) > EPSILON);
	};
}

module.exports = new AnalyticsController();