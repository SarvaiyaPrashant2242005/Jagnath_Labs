/**
 * @file users.routes.js
 * @description Express routes for Auth endpoints.
 */
const express = require("express");
const router = express.Router();
const usersController = require("./users.controller");
const { authenticateToken } = require("../../../middlewares/auth.middleware");

router.post("/register", usersController.register);
router.post("/login", usersController.login);
router.post("/refresh-token", usersController.rotateToken);
router.get("/me", authenticateToken, usersController.getMe);
router.post("/logout", authenticateToken, usersController.logout);

module.exports = router;
