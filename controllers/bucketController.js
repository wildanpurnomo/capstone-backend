const { ErrorHandler } = require('../lib/error');
const BucketModel = require('../models/BucketModel');
const BaseController = require('./baseController');
const path = require('path');
const { Storage } = require('@google-cloud/storage');
const bcrypt = require('bcrypt');
const CLOUD_BUCKET = process.env.CLOUD_BUCKET;
const storage = new Storage({
    projectId: process.env.GCLOUD_PROJECT_ID,
    keyFilename: process.env.KEYFILE_PATH
});

class BucketController extends BaseController {
    constructor() {
        super();
        this.fetchPersonalBucket_get = this.fetchPersonalBucket_get.bind(this);
        this.saveBucket_post = this.saveBucket_post.bind(this);
    }

    async fetchPersonalBucket_get(req, res, next) {
        try {
            let decoded = this.verifyToken(req);
            if (decoded) {
                let bucketList = await BucketModel.find({ creatorId: decoded.id, folderId: req.params.folderId });
                res.status(200).json(super.createSuccessResponse({ bucketData: bucketList }));
            } else {
                throw new ErrorHandler("Session expired");
            }
        } catch (error) {
            super.logMessage("bucketController.js at fetchBucket_get", error);
            next(error);
        }
    }

    async saveBucket_post(req, res, next) {
        try {
            let decoded = this.verifyToken(req);
            if (decoded) {
                if (!req.files) {
                    throw new ErrorHandler("No uploaded docs");
                }

                let creatorId = decoded.id;
                let { folderId } = req.body;

                if (!creatorId || !folderId) {
                    throw new ErrorHandler("No creatorId or folderId");
                }

                let bucket = storage.bucket(CLOUD_BUCKET);
                let promises = [];
                let salt = await bcrypt.genSalt();

                req.files['docs'].forEach((file) => {
                    promises.push(new Promise(async (resolve, reject) => {
                        let fileType = path.extname(file.originalname);
                        let hashed = await bcrypt.hash(file.originalname, salt);
                        let gcsName = `${hashed}${fileType}`;
                        let blob = bucket.file(gcsName);
                        let blobStream = blob.createWriteStream();

                        blobStream.on('error', err => {
                            reject(err);
                        });

                        blobStream.on('finish', async () => {
                            try {
                                let toBeSaved = {
                                    creatorId: creatorId,
                                    folderId: folderId,
                                    documentUrl: `${process.env.CLOUD_PUBLIC_BASE_URL}/${CLOUD_BUCKET}/${gcsName}`,
                                    documentType: fileType,
                                    documentOriginalName: file.originalname
                                };
                                resolve(await BucketModel.create(toBeSaved));
                            } catch (error) {
                                reject(error);
                            }
                        });

                        blobStream.end(file.buffer);
                    }));
                });

                Promise.all(promises)
                    .then(saved => {
                        res.status(200).json(super.createSuccessResponse({ bucketData: saved }));
                    })
                    .catch(err => {
                        super.logMessage("bucketController.js at saveBucket_post", err);
                        next(err);
                    });
            } else {
                throw new ErrorHandler("Session expired");
            }
        } catch (error) {
            super.logMessage("bucketController.js at saveBucket_post", error);
            next(error);
        }
    }

    isDuplicateFileName(currentBucketList, fileName) {
        let filteredByName = currentBucketList.filter(bucket => {
            return bucket.documentOriginalName === fileName;
        });

        return filteredByName.length > 0;
    }
}

module.exports = new BucketController();