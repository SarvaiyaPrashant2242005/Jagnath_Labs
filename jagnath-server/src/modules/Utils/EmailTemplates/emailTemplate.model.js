/**
 * @file emailTemplate.model.js
 * @description Sequelize model for Email Templates.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const EmailTemplate = sequelize.define("EmailTemplate", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    companyId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: "companies",
            key: "id"
        },
        field: "company_id"
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    templateType: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "template_type"
    },
    subject: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    body: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM("Active", "Inactive"),
        defaultValue: "Active",
        allowNull: false,
    }
}, {
    tableName: "email_templates",
    paranoid: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
});

module.exports = EmailTemplate;
