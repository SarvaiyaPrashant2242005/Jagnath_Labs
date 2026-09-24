/**
 * @file department.routes.js
 * @description Express routes for Department endpoints.
 */
const express = require("express");
const router = express.Router();
const departmentController = require("./department.controller");
const { authenticateToken } = require("../../../middlewares/auth.middleware");

// Protect all department routes
router.use(authenticateToken);

router.post("/", departmentController.create);
router.get("/", departmentController.getAll);
router.get("/:id", departmentController.getById);
router.put("/:id", departmentController.update);
router.delete("/:id", departmentController.remove);

module.exports = router;
