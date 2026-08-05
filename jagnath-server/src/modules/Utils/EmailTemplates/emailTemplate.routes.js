/**
 * @file emailTemplate.routes.js
 * @description Express routes for Email Template endpoints.
 */

const express = require("express");
const router = express.Router();
const emailTemplateController = require("./emailTemplate.controller");
const { authenticateToken } = require("../../../middlewares/auth.middleware");

router.use(authenticateToken);

router.post("/", emailTemplateController.create);
router.get("/", emailTemplateController.getAll);
router.get("/:id", emailTemplateController.getById);
router.put("/:id", emailTemplateController.update);
router.delete("/:id", emailTemplateController.remove);

module.exports = router;
