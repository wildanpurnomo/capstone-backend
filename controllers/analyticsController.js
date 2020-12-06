const { ErrorHandler } = require('../lib/error');
const BaseController = require('./baseController');
const spawn = require('child_process').spawn;
const path = require('path');

class AnalyticsController extends BaseController {
    constructor() {
        super();
        this.processDocuments_post = this.processDocuments_post.bind(this);
    }

    async processDocuments_post(req, res, next) {
        try {
            let decoded = this.verifyToken(req);
            if (decoded) {
                let { documents, threshold } = req.body;
                this.validateClientInput(documents, threshold);

                let promises = [];
                documents.forEach((item, _) => {
                    if (this.isDocumentTypeDocx(item.documentType)) {
                        promises.push(this.processDocx(item.documentUrl));
                    } else if (this.isDocumentTypePdf(item.documentType)) {
                        promises.push(this.processPdf(item.documentUrl));
                    } else {
                        throw new ErrorHandler("Currently not supporting this document type");
                    }
                });

                Promise.all(promises)
                    .then(values => {
                        let inputObject = { values };

                        this.processAnalytics(inputObject, threshold)
                            .then(result => {
                                if (result.includes("Tidak ada")) {
                                    res.status(200).json(super.createSuccessResponse({ message: "Tidak dideteksi plagiasi", report: [] }));
                                } else {
                                    let jsonResult = JSON.parse(result.replace(/'/g, '"'));
                                    let optimized = [];
                                    Object.keys(jsonResult).forEach(key => {
                                        optimized.push({
                                            index: jsonResult[key].index,
                                            similarity: jsonResult[key].similarity
                                        });
                                    });
                                    res.status(200).json(super.createSuccessResponse({ message: "Plagiasi terdeteksi" , report: optimized }));
                                }
                            })
                            .catch(error => {
                                super.logMessage("analyticsController.js at processDocuments_post", error);
                                next(new ErrorHandler("Failed to perform analytics"));
                            });
                    })
                    .catch(error => {
                        super.logMessage("analyticsController.js at processDocuments_post", error);
                        next(new ErrorHandler("Failed to process documents' urls"));
                    });
            } else {
                throw new ErrorHandler("Session expired");
            }
        } catch (error) {
            super.logMessage("analyticsController.js at processDocuments_post", error);
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

    isDocumentTypePdf(docType) {
        return docType.toLowerCase().includes("pdf");
    }

    isDocumentTypeDocx(docType) {
        return docType.toLowerCase().includes("docx");
    }

    processDocx(url) {
        return new Promise((resolve, reject) => {
            let process = spawn('python', [path.join(__dirname, '/../pythonScripts/processDocx.py'), url]);
            let result = "";
            process.stdout.on('data', data => {
                result += data.toString();
            });
            process.stdout.on('end', () => {
                resolve(result);
            });
            process.stderr.on('data', data => {
                reject(data.toString());
            });
            process.on('error', err => {
                reject(err.toString());
            });
        });
    }

    processPdf(url) {
        return new Promise((resolve, reject) => {
            let process = spawn('python', [path.join(__dirname, '/../pythonScripts/processPDF.py'), url]);
            let result = "";
            process.stdout.on('data', data => {
                result += data.toString();
            });
            process.stdout.on('end', () => {
                resolve(result);
            });
            process.stderr.on('data', data => {
                reject(data.toString());
            });
            process.on('error', err => {
                reject(err.toString());
            });
        })
    }

    processAnalytics(inputObject, threshold) {
        return new Promise((resolve, reject) => {
            let process = spawn('python', [path.join(__dirname, '/../pythonScripts/analytics.py'),
            JSON.stringify(inputObject), threshold.toString()]);
            process.stdout.on('data', data => {
                resolve(data.toString());
            });
            process.stderr.on('data', data => {
                reject(data.toString());
            });
        })
    }
}

module.exports = new AnalyticsController();