/**
 * @file company.routes.js
 * @description Express routes for Company endpoints.
 */
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const router = express.Router();
const companyController = require("./company.controller");
const { authenticateToken } = require("../../../middlewares/auth.middleware");
const { upload, handleUpload } = require("../../../middlewares/upload.middleware");

// Protect all company routes
router.use(authenticateToken);

// Middleware to inject a company ID before Multer runs (for creates)
const injectCompanyId = (req, res, next) => {
    if (!req.company_id) {
        req.company_id = uuidv4();
    }
    next();
};

const uploadFields = upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'test_request_logo', maxCount: 1 },
    { name: 'test_report_logo', maxCount: 1 },
    { name: 'quotation_logo', maxCount: 1 },
    { name: 'signature', maxCount: 1 }
]);

router.post(
    "/",
    injectCompanyId,
    handleUpload(uploadFields),
    companyController.create
);

router.put(
    "/:id",
    handleUpload(uploadFields), // For updates, ID is already in req.params
    companyController.update
);

router.delete("/:id", companyController.remove);

router.get("/", companyController.getMyCompanies);

module.exports = router;
