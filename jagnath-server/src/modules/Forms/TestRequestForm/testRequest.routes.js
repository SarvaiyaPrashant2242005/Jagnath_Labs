/**
 * @file testRequest.routes.js
 * @description Express routes for TestRequest endpoints.
 */
const express = require("express");
const router = express.Router();
const testRequestController = require("./testRequest.controller");
const { authenticateToken } = require("../../../middlewares/auth.middleware");

// Protect all test-request routes
router.use(authenticateToken);

router.post("/", testRequestController.create);
router.get("/", testRequestController.getAll);
router.get("/latest-report-by-client/:clientId", testRequestController.getLatestByClient);
router.get("/latest-by-client/:clientId", testRequestController.getLatestByClient);
router.get("/:id", testRequestController.getById);
router.put("/:id", testRequestController.update);
router.delete("/:id", testRequestController.remove);

module.exports = router;
