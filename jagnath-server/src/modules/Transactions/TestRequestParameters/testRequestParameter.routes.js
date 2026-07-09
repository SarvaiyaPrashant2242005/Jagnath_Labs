/**
 * @file testRequestParameter.routes.js
 * @description Express routes for TestRequestParameter endpoints.
 */
const express = require("express");
const router = express.Router();
const testRequestParameterController = require("./testRequestParameter.controller");
const { authenticateToken } = require("../../../middlewares/auth.middleware");

// Protect all test-request-parameter routes
router.use(authenticateToken);

router.post("/", testRequestParameterController.create);
router.get("/", testRequestParameterController.getAll);
router.get("/:id", testRequestParameterController.getById);
router.put("/:id", testRequestParameterController.update);
router.delete("/:id", testRequestParameterController.remove);

module.exports = router;
