/**
 * @file users.service.js
 * @description Business logic for User Authentication.
 */
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const path = require("path");
const Users = require("./users.model");
const RefreshTokens = require("../RefreshTokens/refresh_tokens.model");
const { writeLogToFile } = require("../../../services/loggerService");

const JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET || "fallback_secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "fallback_refresh_secret";
const ACCESS_TOKEN_EXPIRES = process.env.JWT_EXPIRE || process.env.ACCESS_TOKEN_EXPIRES || "7d";
const REFRESH_TOKEN_EXPIRES_DAYS = 30;

const registerLogPath = path.join(__dirname, "../../../../logs/Auth/Register.txt");
const loginLogPath = path.join(__dirname, "../../../../logs/Auth/Login.txt");

const register = async (userData, reqInfo) => {
    try {
        const existingUser = await Users.findOne({ where: { email: userData.email } });
        if (existingUser) {
            writeLogToFile(`[${new Date().toISOString()}] Email: ${userData.email} | IP: ${reqInfo.ip} | UserAgent: ${reqInfo.userAgent} | Success: false | Reason: Email already exists`, registerLogPath);
            throw new Error("Email already registered");
        }

        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        const newUser = await Users.create({
            name: userData.name,
            email: userData.email,
            password: hashedPassword,
            role: userData.role || "User",
            status: userData.status || "Active"
        });

        // Omit password from response
        const userResponse = newUser.toJSON();
        delete userResponse.password;

        writeLogToFile(`[${new Date().toISOString()}] Email: ${newUser.email} | IP: ${reqInfo ? reqInfo.ip : 'N/A'} | UserAgent: ${reqInfo ? reqInfo.userAgent : 'N/A'} | Success: true | Created User ID: ${newUser.id}`, registerLogPath);

        return userResponse;
    } catch (error) {
        throw error;
    }
};

const login = async (credentials, reqInfo) => {
    try {
        const user = await Users.findOne({ where: { email: credentials.email } });
        if (!user) {
            writeLogToFile(`[${new Date().toISOString()}] Email: ${credentials.email} | IP: ${reqInfo.ip} | UserAgent: ${reqInfo.userAgent} | Success: false | Reason: Invalid email or password`, loginLogPath);
            throw new Error("Invalid email or password");
        }

        if (user.status !== "Active") {
            writeLogToFile(`[${new Date().toISOString()}] Email: ${credentials.email} | IP: ${reqInfo.ip} | UserAgent: ${reqInfo.userAgent} | Success: false | Reason: Account is ${user.status}`, loginLogPath);
            throw new Error(`Account is ${user.status}`);
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.password);
        if (!isValidPassword) {
            writeLogToFile(`[${new Date().toISOString()}] Email: ${credentials.email} | IP: ${reqInfo.ip} | UserAgent: ${reqInfo.userAgent} | Success: false | Reason: Invalid email or password`, loginLogPath);
            throw new Error("Invalid email or password");
        }

        const tokenPayload = {
            user_id: user.id,
            email: user.email,
            role: user.role || 'SuperAdmin',
            company_id: null
        };

        const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
        
        // Generate Refresh Token
        const rawRefreshToken = crypto.randomBytes(40).toString("hex");
        const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

        await RefreshTokens.create({
            user_id: user.id,
            token_hash: tokenHash,
            expires_at: expiresAt
        });

        writeLogToFile(`[${new Date().toISOString()}] Email: ${user.email} | IP: ${reqInfo.ip} | UserAgent: ${reqInfo.userAgent} | Success: true`, loginLogPath);

        return {
            user: { id: user.id, name: user.name, email: user.email, role: user.role || 'SuperAdmin', status: user.status },
            token: accessToken,
            accessToken,
            refreshToken: rawRefreshToken
        };
    } catch (error) {
        throw error;
    }
};

const getUserById = async (id) => {
    try {
        const user = await Users.findByPk(id, {
            attributes: { exclude: ["password", "deleted_at"] }
        });
        return user;
    } catch (error) {
        throw error;
    }
};

const getAllUsers = async (page = 1, limit = 10, search = '', roleFilter = '') => {
    try {
        const offset = (page - 1) * limit;
        const { Op } = require("sequelize");
        const whereClause = {};

        if (search) {
            whereClause[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } }
            ];
        }

        if (roleFilter && roleFilter !== 'ALL') {
            whereClause.role = roleFilter;
        }

        const { count, rows } = await Users.findAndCountAll({
            where: whereClause,
            attributes: { exclude: ["password", "deleted_at"] },
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
            order: [["created_at", "DESC"]]
        });

        return {
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page, 10),
            data: rows
        };
    } catch (error) {
        throw error;
    }
};

const updateUser = async (id, updateData) => {
    try {
        const user = await Users.findByPk(id);
        if (!user) throw new Error("User not found");

        if (updateData.password && updateData.password.trim() !== '') {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        } else {
            delete updateData.password;
        }

        await user.update(updateData);

        const updatedUser = user.toJSON();
        delete updatedUser.password;
        return updatedUser;
    } catch (error) {
        throw error;
    }
};

const deleteUser = async (id) => {
    try {
        const user = await Users.findByPk(id);
        if (!user) throw new Error("User not found");
        await user.destroy();
        return { success: true };
    } catch (error) {
        throw error;
    }
};

const rotateToken = async (rawRefreshToken) => {
    try {
        const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
        const rTokenRecord = await RefreshTokens.findOne({ where: { token_hash: tokenHash } });

        if (!rTokenRecord) {
            throw new Error("Invalid refresh token");
        }

        if (new Date() > rTokenRecord.expires_at) {
            await rTokenRecord.destroy();
            throw new Error("Refresh token expired");
        }

        const user = await Users.findByPk(rTokenRecord.user_id);
        if (!user || user.status !== "Active") {
            throw new Error("User inactive or not found");
        }

        // Delete the old token (Rotation)
        await rTokenRecord.destroy();

        // Generate New Tokens
        const tokenPayload = {
            user_id: user.id,
            email: user.email,
            company_id: null
        };

        const newAccessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
        const newRawRefreshToken = crypto.randomBytes(40).toString("hex");
        const newTokenHash = crypto.createHash('sha256').update(newRawRefreshToken).digest('hex');
        
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

        await RefreshTokens.create({
            user_id: user.id,
            token_hash: newTokenHash,
            expires_at: expiresAt
        });

        return {
            accessToken: newAccessToken,
            refreshToken: newRawRefreshToken
        };
    } catch (error) {
        throw error;
    }
};

module.exports = {
    register,
    login,
    rotateToken,
    getUserById,
    getAllUsers,
    updateUser,
    deleteUser
};
