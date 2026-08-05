/**
 * @file testReport.routes.js
 * @description Express routes for Test Reports.
 */
const express = require("express");
const router = express.Router();
const testReportController = require("./testReport.controller");
const { authenticateToken } = require("../../../middlewares/auth.middleware");

// Protect all test-report routes
router.use(authenticateToken);

router.post("/", testReportController.create);
router.get("/", testReportController.getAll);
router.get("/:id", testReportController.getById);
router.post("/:id/send-email", testReportController.sendEmail);
router.put("/:id", testReportController.update);
router.delete("/:id", testReportController.remove);

module.exports = router;
