/**
 * @file subCategory.routes.js
 * @description Express route definitions for SubCategories.
 */

const express = require("express");
const router = express.Router();
const subCategoryController = require("./subCategory.controller");

router.post("/", subCategoryController.create);
router.post("/bulk-import", subCategoryController.bulkImport);
router.get("/", subCategoryController.getAll);
router.get("/:id", subCategoryController.getById);
router.put("/:id", subCategoryController.update);
router.delete("/:id", subCategoryController.remove);

module.exports = router;
