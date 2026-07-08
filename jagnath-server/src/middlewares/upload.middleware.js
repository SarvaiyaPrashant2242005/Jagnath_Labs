/**
 * @file upload.middleware.js
 * @description Middleware for handling multipart/form-data uploads via Multer.
 */

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { errorResponse } = require("../utils/response");

// Maximum file size: 16MB
const MAX_SIZE = 16 * 1024 * 1024;

// Allowed file extensions
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/svg+xml", "application/pdf"];

/**
 * Multer storage configuration for Company uploads.
 * Saves files to uploads/Companies/<Company_ID>/<Field_Name>/
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // We expect company_id to be available, either in req.params or req.body or generated in service.
        // Wait, for creating a company, the ID might not exist yet, so we might need a temporary folder 
        // or generate the UUID in the middleware/controller.
        // Let's use a temporary fallback if company_id is not in params/body, but usually it should be provided
        // or we handle upload AFTER company creation. 
        // A common pattern is generating the UUID in the controller and passing it to req.
        const body = req.body || {};
        const companyId = body.company_id || req.params.id || req.query.company_id || 'temp';
        const fieldName = file.fieldname; // 'logo' or 'signature'

        const destFolder = path.join(__dirname, "../../uploads/Companies", companyId, fieldName);
        
        if (!fs.existsSync(destFolder)) {
            fs.mkdirSync(destFolder, { recursive: true });
        }
        cb(null, destFolder);
    },
    filename: (req, file, cb) => {
        // Keep original filename or generate a unique one. We will append a timestamp to ensure uniqueness.
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, `${name}_${Date.now()}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("INVALID_FILE_TYPE"), false);
    }
};

const upload = multer({
    storage,
    limits: { fileSize: MAX_SIZE },
    fileFilter
});

/**
 * Wrapper to handle Multer errors and return standardized error response.
 */
const handleUpload = (multerMiddleware) => {
    return (req, res, next) => {
        multerMiddleware(req, res, (err) => {
            if (err) {
                if (err instanceof multer.MulterError) {
                    if (err.code === "LIMIT_FILE_SIZE") {
                        return res.status(400).json(errorResponse(
                            "FILE_TOO_LARGE",
                            "File size exceeds 16MB limit.",
                            "The uploaded file is too large. Maximum allowed size is 16MB."
                        ));
                    }
                } else if (err.message === "INVALID_FILE_TYPE") {
                    return res.status(400).json(errorResponse(
                        "INVALID_FILE_TYPE",
                        "File type not allowed.",
                        "Only PNG, JPG, JPEG, SVG, and PDF files are allowed."
                    ));
                }
                return res.status(500).json(errorResponse(
                    "UPLOAD_ERROR",
                    err.message,
                    "An error occurred during file upload."
                ));
            }
            next();
        });
    };
};

module.exports = {
    upload,
    handleUpload
};
