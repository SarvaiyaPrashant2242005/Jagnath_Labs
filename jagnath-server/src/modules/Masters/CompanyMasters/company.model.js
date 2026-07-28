/**
 * @file company.model.js
 * @description Sequelize model for Companies (cleaned schema with no duplicates).
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const Company = sequelize.define("Company", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: "users",
            key: "id",
        }
    },
    company_code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    company_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    company_email: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    contact_number: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    city: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    logo: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    signature: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM("Active", "Inactive"),
        defaultValue: "Active",
    }
}, {
    tableName: "companies",
    paranoid: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
});

module.exports = Company;
