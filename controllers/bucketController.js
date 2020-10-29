const { ErrorHandler } = require('../lib/error');
const { logIfDebug } = require('../lib/logger');
const BucketModel = require('../models/BucketModel');
const BaseController = require('./baseController');
const path = require('path');
const { Storage } = require('@google-cloud/storage');

const CLOUD_BUCKET = process.env.CLOUD_BUCKET;
const storage = new Storage({
    projectId: process.env.GCLOUD_PROJECT_ID,
    keyFilename: process.env.KEYFILE_PATH
});

class BucketController extends BaseController {
    constructor() {
        super();
        this.fetchBucket_get = this.fetchBucket_get.bind(this);
        this.saveBucket_post = this.saveBucket_post.bind(this);
    }

    async fetchBucket_get(req, res, next) {
        try {
            let decoded = this.verifyToken(req);
            if (decoded) {
                let { creatorId, folderId } = super.decryptRequestBody(req.body);
                if (!creatorId || !folderId) {
                    throw new ErrorHandler("No creatorId or folderId");
                }
                let bucketList = await BucketModel.find({ creatorId: creatorId, folderId: folderId });
                res.status(200).json(super.createSuccessResponse({ bucketData: bucketList }));
            } else {
                throw new ErrorHandler("Session expired");
            }
        } catch (error) {
            logIfDebug("bucketController.js at fetchBucket_get", error);
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

                let { creatorId, folderId } = super.decryptRequestBody(req.body);
                if (!creatorId || !folderId) {
                    throw new ErrorHandler("No creatorId or folderId");
                }

                let currentBucketList = await BucketModel.find({ creatorId: creatorId, folderId: folderId });
                let bucket = storage.bucket(CLOUD_BUCKET);
                let promises = [];
                req.files['docs'].forEach((file, _) => {
                    if (!this.isDuplicateFileName(currentBucketList, file.originalname)) {
                        let fileType = path.extname(file.originalname);
                        let gcsName = `user_${creatorId}_folder_${folderId}_${Date.now()}${fileType}`;
                        let blob = bucket.file(gcsName);
    
                        let promise = new Promise((resolve, reject) => {
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
                                    await BucketModel.create(toBeSaved);
                                    resolve();
                                } catch (error) {
                                    reject(error);
                                }
                            });
    
                            blobStream.end(file.buffer);
                        });
    
                        promises.push(promise);
                    }
                });

                Promise.all(promises)
                    .then( async _ => {
                        let bucketList = await BucketModel.find({ creatorId: creatorId, folderId: folderId });
                        res.status(200).json(super.createSuccessResponse({ bucketData: bucketList }));
                    })
                    .catch(err => {
                        throw err;
                    });
            } else {
                throw new ErrorHandler("Session expired");
            }
        } catch (error) {
            logIfDebug("bucketController.js at saveBucket_post", error);
            next(error);
        }
    }

    isDuplicateFileName(currentBucketList, fileName) {
        let filteredByName = currentBucketList.filter( bucket => {
            return bucket.documentOriginalName === fileName;
        });
        
        return filteredByName.length > 0;
    }
}

module.exports = new BucketController();