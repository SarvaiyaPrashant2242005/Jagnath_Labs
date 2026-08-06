/**
 * @file locationSample.routes.js
 * @description Express routes for Location of Sample Master endpoints.
 */
const express = require("express");
const router = express.Router();
const locationSampleController = require("./locationSample.controller");
const { authenticateToken } = require("../../../middlewares/auth.middleware");

// Protect all routes
router.use(authenticateToken);

router.post("/", locationSampleController.create);
router.get("/", locationSampleController.getAll);
router.get("/:id", locationSampleController.getById);
router.put("/:id", locationSampleController.update);
router.delete("/:id", locationSampleController.remove);

module.exports = router;
