/**
 * @file provisionalQuotation.routes.js
 * @description Express routes for Provisional and General Quotations.
 */

const express = require("express");
const router = express.Router();
const provisionalQuotationController = require("./provisionalQuotation.controller");
const { authenticateToken } = require("../../../middlewares/auth.middleware");

// Protect all quotation routes
router.use(authenticateToken);

router.get("/", provisionalQuotationController.getAllQuotations);
router.get("/:id", provisionalQuotationController.getQuotationById);
router.post("/", provisionalQuotationController.saveQuotation);
router.put("/:id", provisionalQuotationController.saveQuotation);
router.delete("/:id", provisionalQuotationController.deleteQuotation);
router.post("/:id/duplicate", provisionalQuotationController.duplicateQuotation);
router.post("/:id/revision", provisionalQuotationController.createQuotationRevision);

module.exports = router;
