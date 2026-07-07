/**
 * @file refresh_tokens.model.js
 * @description Sequelize model for RefreshTokens.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");
const Users = require("../Users/users.model");

const RefreshTokens = sequelize.define("RefreshTokens", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Users,
            key: "id",
        }
    },
    token_hash: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
    },
}, {
    tableName: "refresh_tokens",
    paranoid: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
});

module.exports = RefreshTokens;
