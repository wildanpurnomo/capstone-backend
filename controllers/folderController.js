const { ErrorHandler } = require('../lib/error');
const FolderModel = require('../models/FolderModel');
const BucketModel = require('../models/BucketModel');
const BaseController = require('./baseController');

class FolderController extends BaseController {
    constructor() {
        super();
        this.fetchByUserId_get = this.fetchByUserId_get.bind(this);
        this.addFolder_post = this.addFolder_post.bind(this);
        this.editFolder_put = this.editFolder_put.bind(this);
        this.deleteFolder_delete = this.deleteFolder_delete.bind(this);
    }

    async fetchByUserId_get(req, res, next) {
        try {
            let decoded = this.verifyToken(req);
            if (decoded) {
                let folderList = await FolderModel
                    .find({ creatorId: decoded.id })
                    .select('-creatorId');
                res.status(200).json(super.createSuccessResponse({ folderList: folderList }));
            } else {
                throw new ErrorHandler("Session expired");
            }
        } catch (error) {
            super.logMessage("folderController.js at fetchByUserId_get", error);
            next(error);
        }
    }

    async addFolder_post(req, res, next) {
        try {
            let decoded = this.verifyToken(req);
            if (decoded) {
                req.body.creatorId = decoded.id;
                let folder = await FolderModel.add(req.body);
                folder.creatorId = undefined;
                res.status(200).json(super.createSuccessResponse({ folderData: folder }));
            } else {
                throw new ErrorHandler("Session expired");
            }
        } catch (error) {
            super.logMessage("folderController.js at addFolder_post", error);
            next(error);
        }
    }

    async editFolder_put(req, res, next) {
        try {
            let decoded = this.verifyToken(req);
            if (decoded) {
                let folder = await FolderModel.alter(decoded.id, req.params.folderId, req.body);
                folder.creatorId = undefined;
                res.status(200).json(super.createSuccessResponse({ folderData: folder }));
            } else {
                throw new ErrorHandler("Session expired");
            }
        } catch (error) {
            super.logMessage("folderController.js at editFolder_put", error);
            next(error);
        }
    }

    async deleteFolder_delete(req, res, next) {
        try {
            let decoded = this.verifyToken(req);
            if (decoded) {
                let deleted = await FolderModel.deleteOne({ _id: req.params.folderId });
                deleted.creatorId = undefined;
                BucketModel.deleteMany({ folderId: req.params.folderId }).exec();
                res.status(200).json(super.createSuccessResponse({ deletedFolder: deleted }));
            } else {
                throw new ErrorHandler("Session expired");
            }
        } catch (error) {
            super.logMessage("folderController.js at deleteFolder_delete", error);
            next(error);
        }
    }
}

module.exports = new FolderController();