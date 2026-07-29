/**
 * @file caution.routes.js
 * @description Express routes for Caution Master endpoints.
 */

const express = require("express");
const router = express.Router();
const cautionController = require("./caution.controller");
const { authenticateToken } = require("../../../middlewares/auth.middleware");

// All routes protected by JWT auth
router.use(authenticateToken);

router.get("/", cautionController.getCautionsHandler);
router.get("/:id", cautionController.getCautionByIdHandler);
router.post("/", cautionController.createCautionHandler);
router.put("/:id", cautionController.updateCautionHandler);
router.delete("/:id", cautionController.deleteCautionHandler);

module.exports = router;
