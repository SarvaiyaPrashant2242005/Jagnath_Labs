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
router.post("/forgot-password", usersController.forgotPassword);
router.post("/verify-otp", usersController.verifyOtp);
router.post("/reset-password", usersController.resetPassword);
router.post("/refresh-token", usersController.rotateToken);
router.get("/me", authenticateToken, usersController.getMe);
router.post("/logout", authenticateToken, usersController.logout);

// User Management Routes
router.get("/users", authenticateToken, usersController.getAllUsers);
router.post("/users/bulk-import", authenticateToken, usersController.bulkImport);
router.post("/users", authenticateToken, usersController.register);
router.put("/users/:id", authenticateToken, usersController.updateUser);
router.delete("/users/:id", authenticateToken, usersController.deleteUser);


module.exports = router;
