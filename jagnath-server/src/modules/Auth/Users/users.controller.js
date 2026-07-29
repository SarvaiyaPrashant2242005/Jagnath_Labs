/**
 * @file users.controller.js
 * @description HTTP layer for Auth APIs.
 */
const { registerSchema, loginSchema, refreshTokenSchema } = require("./users.validators");
const usersService = require("./users.service");
const { successResponse, errorResponse } = require("../../../utils/response");

const register = async (req, res) => {
    try {
        const { error, value } = registerSchema.validate(req.body || {});
        if (error) {
            return res.status(400).json(errorResponse(
                "VALIDATION_ERROR",
                error.details[0].message,
                error.details[0].message
            ));
        }

        const reqInfo = {
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers["user-agent"]
        };

        const newUser = await usersService.register(value, reqInfo);
        
        return res.status(201).json(successResponse(
            "USER_REGISTERED",
            "User registered successfully.",
            "User registered successfully.",
            newUser
        ));
    } catch (err) {
        if (err.message === "Email already registered") {
            return res.status(409).json(errorResponse("EMAIL_EXISTS", err.message, "This email is already in use."));
        }
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "An unexpected error occurred."));
    }
};

const login = async (req, res) => {
    try {
        const { error, value } = loginSchema.validate(req.body || {});
        if (error) {
            return res.status(400).json(errorResponse(
                "VALIDATION_ERROR",
                error.details[0].message,
                error.details[0].message
            ));
        }

        const reqInfo = {
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers["user-agent"]
        };

        const data = await usersService.login(value, reqInfo);

        return res.status(200).json(successResponse(
            "LOGIN_SUCCESS",
            "User logged in successfully.",
            "Login successful.",
            data
        ));
    } catch (err) {
        if (err.message === "Invalid email or password" || err.message.startsWith("Account is")) {
            return res.status(401).json(errorResponse("AUTH_FAILED", err.message, err.message));
        }
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "An unexpected error occurred."));
    }
};

const rotateToken = async (req, res) => {
    try {
        const { error, value } = refreshTokenSchema.validate(req.body || {});
        if (error) {
            return res.status(400).json(errorResponse(
                "VALIDATION_ERROR",
                error.details[0].message,
                error.details[0].message
            ));
        }

        const data = await usersService.rotateToken(value.refresh_token);

        return res.status(200).json(successResponse(
            "TOKEN_REFRESHED",
            "Tokens rotated successfully.",
            "Tokens refreshed.",
            data
        ));
    } catch (err) {
        return res.status(403).json(errorResponse("FORBIDDEN", err.message, "Invalid or expired refresh token. Please login again."));
    }
};

const getMe = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const user = await usersService.getUserById(userId);
        if (!user) {
            return res.status(404).json(errorResponse("NOT_FOUND", "User not found.", "User not found."));
        }
        return res.status(200).json(successResponse(
            "USER_ME",
            "User retrieved successfully.",
            "User profile retrieved successfully.",
            user
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "An unexpected error occurred."));
    }
};

const logout = async (req, res) => {
    try {
        return res.status(200).json(successResponse(
            "LOGOUT_SUCCESS",
            "Logged out successfully.",
            "Logged out successfully.",
            null
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "An unexpected error occurred."));
    }
};

const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', role = '' } = req.query;
        const result = await usersService.getAllUsers(page, limit, search, role);
        return res.status(200).json(successResponse(
            "USERS_FETCHED",
            "Users fetched successfully.",
            "Users retrieved.",
            result.data,
            {
                totalItems: result.totalItems,
                totalPages: result.totalPages,
                currentPage: result.currentPage,
                pageSize: parseInt(limit, 10)
            }
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "An unexpected error occurred."));
    }
};

const updateUser = async (req, res) => {
    try {
        const updated = await usersService.updateUser(req.params.id, req.body);
        return res.status(200).json(successResponse(
            "USER_UPDATED",
            "User updated successfully.",
            "User updated successfully.",
            updated
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to update user."));
    }
};

const deleteUser = async (req, res) => {
    try {
        await usersService.deleteUser(req.params.id);
        return res.status(200).json(successResponse(
            "USER_DELETED",
            "User deleted successfully.",
            "User deleted successfully.",
            null
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to delete user."));
    }
};

const bulkImport = async (req, res) => {
    try {
        const { rows } = req.body || {};
        if (!Array.isArray(rows) || rows.length === 0) {
            return res.status(400).json(errorResponse("VALIDATION_ERROR", "No rows provided for bulk import.", "No valid data provided."));
        }

        const result = await usersService.bulkImportUsers(rows);
        return res.status(200).json(successResponse(
            "USERS_BULK_IMPORTED",
            `Successfully processed ${result.totalProcessed} users (${result.createdCount} created, ${result.updatedCount} updated).`,
            "Bulk import completed.",
            result
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to bulk import users."));
    }
};

module.exports = {
    register,
    login,
    rotateToken,
    getMe,
    logout,
    getAllUsers,
    updateUser,
    deleteUser,
    bulkImport
};

