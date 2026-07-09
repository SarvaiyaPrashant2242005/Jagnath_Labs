/**
 * @file categoryParameterMapping.routes.js
 * @description Express routes for CategoryParameterMapping endpoints.
 */
const express = require("express");
const router = express.Router();
const categoryParameterMappingController = require("./categoryParameterMapping.controller");
const { authenticateToken } = require("../../../middlewares/auth.middleware");

// Protect all category-parameter-mapping routes
router.use(authenticateToken);

router.post("/", categoryParameterMappingController.create);
router.get("/", categoryParameterMappingController.getAll);

// Combined GET endpoint to fetch mapping by ID OR parameters by Category ID
router.get("/:id", categoryParameterMappingController.getByIdOrCategory);

// Explicit sub-route to fetch mapped parameters
router.get("/category/:categoryId", categoryParameterMappingController.getParametersByCategory);

router.put("/:id", categoryParameterMappingController.update);
router.delete("/:id", categoryParameterMappingController.remove);

module.exports = router;
