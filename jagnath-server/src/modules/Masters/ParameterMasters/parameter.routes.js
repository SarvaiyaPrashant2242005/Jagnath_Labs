/**
 * @file parameter.routes.js
 * @description Express routes for Parameter endpoints.
 */
const express = require("express");
const router = express.Router();
const parameterController = require("./parameter.controller");
const { authenticateToken } = require("../../../middlewares/auth.middleware");

// Protect all parameter routes
router.use(authenticateToken);

router.post("/bulk-import", parameterController.bulkImport);
router.post("/", parameterController.create);
router.get("/", parameterController.getAll);
router.get("/:id", parameterController.getById);
router.put("/:id", parameterController.update);
router.delete("/:id", parameterController.remove);

module.exports = router;
