/**
 * @file users.model.js
 * @description Sequelize model for Users.
 */
// users.model.js

const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const Users = sequelize.define("Users", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    full_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM("Active", "Inactive", "Blocked", "Deleted"),
        defaultValue: "Active",
    },
}, {
    tableName: "users",
    paranoid: true, // Enables soft delete (deleted_at)
    timestamps: true, // Enables created_at and updated_at
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
});

module.exports = Users;
