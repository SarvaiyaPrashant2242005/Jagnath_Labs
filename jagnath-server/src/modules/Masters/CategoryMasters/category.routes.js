/**
 * @file category.routes.js
 * @description Express routes for Category endpoints.
 */
const express = require("express");
const router = express.Router();
const categoryController = require("./category.controller");
const { authenticateToken } = require("../../../middlewares/auth.middleware");

// Protect all category routes
router.use(authenticateToken);

router.post("/", categoryController.create);
router.get("/", categoryController.getAll);
router.get("/:id", categoryController.getById);
router.put("/:id", categoryController.update);
router.delete("/:id", categoryController.remove);

module.exports = router;
