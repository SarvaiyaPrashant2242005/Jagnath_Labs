/**
 * @file company.model.js
 * @description Sequelize model for Companies.
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
    companyName: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    companyEmail: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    website: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
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
    address: DataTypes.TEXT,
    city: DataTypes.STRING,
    contact_number: DataTypes.STRING,
    company_email: DataTypes.STRING,
    // pan_card_number: DataTypes.STRING,
    // gst_number: DataTypes.STRING,
    // cha_licence_number: DataTypes.STRING,
    // bank_name: DataTypes.STRING,
    // account_number: DataTypes.STRING,
    // ifsc_code: DataTypes.STRING,
    // branch_name: DataTypes.STRING,
    // usd_bank: DataTypes.STRING,
    // usd_account_number: DataTypes.STRING,
    // usd_ifsc_swift_code: DataTypes.STRING,
    // usd_branch: DataTypes.STRING,
    // einvoice_username: DataTypes.STRING,
    // einvoice_password: DataTypes.STRING,
    logo: DataTypes.STRING,
    signature: DataTypes.STRING,
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
