const { ErrorHandler } = require('../lib/error');
const { logIfDebug } = require('../lib/logger');
const FolderModel = require('../models/FolderModel');
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
                let { creatorId } = super.decryptRequestBody(req.body);
                let folderList = await FolderModel.find({ creatorId: creatorId });
                res.status(200).json(super.createSuccessResponse({ folderList: folderList }));
            } else {
                throw new ErrorHandler("Session expired");
            }
        } catch (error) {
            logIfDebug("folderController.js at fetchByUserId_get", error);
            next(error);
        }
    }

    async addFolder_post(req, res, next) {
        try {
            let decoded = this.verifyToken(req);
            if (decoded) {
                let folder = await FolderModel.add(super.decryptRequestBody(req.body));
                res.status(200).json(super.createSuccessResponse({ folderData: folder }));
            } else {
                throw new ErrorHandler("Session expired");
            }
        } catch (error) {
            logIfDebug("folderController.js at addFolder_post", error);
            next(error);
        }
    }

    async editFolder_put(req, res, next) {
        try {
            let decoded = this.verifyToken(req);
            if (decoded) {
                let folder = await FolderModel.findOneAndUpdate({ _id: req.params.folderId }, super.decryptRequestBody(req.body), { new: true });
                res.status(200).json(super.createSuccessResponse({ folderData: folder }));
            } else {
                throw new ErrorHandler("Session expired");
            }
        } catch (error) {
            logIfDebug("folderController.js at editFolder_put", error);
            next(error);
        }
    }

    async deleteFolder_delete(req, res, next) {
        try {
            let decoded = this.verifyToken(req);
            if (decoded) {
                let deleted = await FolderModel.deleteOne({ _id: req.params.folderId });
                res.status(200).json(super.createSuccessResponse({ deletedFolder: deleted }));
            } else {
                throw new ErrorHandler("Session expired");
            }
        } catch (error) {
            logIfDebug("folderController.js at deleteFolder_delete", error);
            next(error);
        }

    }
}

module.exports = new FolderController();