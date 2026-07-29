/**
 * @file client.routes.js
 * @description Express routes for Client endpoints.
 */
const express = require("express");
const router = express.Router();
const clientController = require("./client.controller");
const { authenticateToken } = require("../../../middlewares/auth.middleware");

// Protect all client routes
router.use(authenticateToken);

router.post("/bulk-import", clientController.bulkImport);
router.post("/", clientController.create);
router.get("/", clientController.getAll);
router.get("/:id", clientController.getById);
router.put("/:id", clientController.update);
router.delete("/:id", clientController.remove);

module.exports = router;
