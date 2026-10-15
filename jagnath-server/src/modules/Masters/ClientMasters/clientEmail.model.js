/**
 * @file clientEmail.model.js
 * @description Sequelize model for Client Email addresses (Multiple emails support).
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const ClientEmail = sequelize.define("ClientEmail", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    clientId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "client_id",
        references: {
            model: "clients",
            key: "id",
        }
    },
    companyId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "company_id",
        references: {
            model: "companies",
            key: "id",
        }
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    createdBy: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "created_by",
    },
    updatedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "updated_by",
    }
}, {
    tableName: "client_emails",
    timestamps: true,
    underscored: true,
});

module.exports = ClientEmail;
