/**
 * @file priceMaster.routes.js
 * @description Express routes for Price Master.
 */
const express = require("express");
const router = express.Router();
const priceMasterController = require("./priceMaster.controller");
const { authenticateToken } = require("../../../middlewares/auth.middleware");

router.use(authenticateToken);

router.get("/", priceMasterController.getAll);
router.get("/:id", priceMasterController.getById);
router.post("/", priceMasterController.create);
router.put("/:id", priceMasterController.update);
router.delete("/:id", priceMasterController.remove);

module.exports = router;
