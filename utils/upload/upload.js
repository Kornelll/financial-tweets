var multer = require('multer');
var path = require('path');
var config = require('../../config/appConfig');
var chance = require('chance')();

module.exports = {
    uploadEodDoc: multer({
        storage: multer.diskStorage({
            destination: config.ATTACHMENT.PATH_DOCS_GENERAL,
            filename: function (req, file, cb) {
                cb(null, chance.guid() + '-' + Date.now() + path.extname(file.originalname));
            }
        }),
        limits: {
            fileSize: config.MAX_UPLOAD_FILE_SIZE
        }
    }),
    uploadBankFile: multer({
        storage: multer.diskStorage({
            destination: config.ATTACHMENT.PATH_BANK_FILE,
            filename: function (req, file, cb) {
                cb(null, chance.guid() + '-' + Date.now() + path.extname(file.originalname));
            }
        }),
        limits: {
            fileSize: config.MAX_UPLOAD_FILE_SIZE
        }
    }),
    uploadFeeChallan: multer({
        storage: multer.diskStorage({
            destination: config.ATTACHMENT.PATH_CHALLAN,
            filename: async function (req, file, cb) {
                cb(null, req.params.challanNo + path.extname(file.originalname));
            }
        }),
        limits: {
            fileSize: config.MAX_UPLOAD_FILE_SIZE
        }
    }),
};