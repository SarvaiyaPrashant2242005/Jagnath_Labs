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
            status: "Active"
        });

        // Omit password from response
        const userResponse = newUser.toJSON();
        delete userResponse.password;

        writeLogToFile(`[${new Date().toISOString()}] Email: ${newUser.email} | IP: ${reqInfo.ip} | UserAgent: ${reqInfo.userAgent} | Success: true | Created User ID: ${newUser.id}`, registerLogPath);

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

        // We assume company_id will be derived later, for now we set it to null or fetch from UserCompanies
        // Since we are not doing roles yet, we'll leave company_id out or set it if available.
        const tokenPayload = {
            user_id: user.id,
            email: user.email,
            company_id: null // To be populated from mapping table when needed
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
            user: { id: user.id, name: user.name, email: user.email, status: user.status },
            token: accessToken,
            accessToken,
            refreshToken: rawRefreshToken // Return raw only once
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
    getUserById
};
