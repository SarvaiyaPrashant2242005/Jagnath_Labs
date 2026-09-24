/**
 * @file auditQuotation.routes.js
 * @description Express routes for Audit Quotation.
 */

const express = require("express");
const router = express.Router();
const auditQuotationController = require("./auditQuotation.controller");
const { authenticateToken } = require("../../../middlewares/auth.middleware");

// Protect all routes
router.use(authenticateToken);

router.get("/test-request/:testRequestId", auditQuotationController.getByTestRequestId);
router.post("/", auditQuotationController.saveQuotation);
router.put("/:id", auditQuotationController.updateQuotation);

module.exports = router;
