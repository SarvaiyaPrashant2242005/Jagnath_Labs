/**
 * @file categoryParameter.routes.js
 * @description Express routes for CategoryParameter mapping endpoints.
 */
const express = require("express");
const router = express.Router();
const categoryParameterController = require("./categoryParameter.controller");
const { authenticateToken } = require("../../../middlewares/auth.middleware");

// Protect all category-parameter mapping routes
router.use(authenticateToken);

router.post("/", categoryParameterController.create);
router.get("/", categoryParameterController.getAll);

// Combined GET endpoint to fetch mapping by ID OR parameters by Category ID
router.get("/:id", categoryParameterController.getByIdOrCategory);

// Explicit sub-route to fetch mapped parameters
router.get("/category/:categoryId", categoryParameterController.getParametersByCategory);

router.put("/:id", categoryParameterController.update);
router.delete("/:id", categoryParameterController.remove);

module.exports = router;
