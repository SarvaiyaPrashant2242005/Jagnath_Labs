/**
 * @file users.routes.js
 * @description Express routes for Auth endpoints.
 */
const express = require("express");
const router = express.Router();
const usersController = require("./users.controller");

router.post("/register", usersController.register);
router.post("/login", usersController.login);
router.post("/refresh-token", usersController.rotateToken);

module.exports = router;
