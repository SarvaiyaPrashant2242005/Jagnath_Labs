/**
 * @file client.model.js
 * @description Sequelize model for Clients.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const Client = sequelize.define("Client", {
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
            key: "id",
        }
    },
    clientName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    contactNumber: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    officeAddress: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "office_address",
        defaultValue: "N/A"
    },
    plantAddress: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "plant_address",
        defaultValue: "N/A"
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    city: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    state: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    gender: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM("Active", "Inactive"),
        defaultValue: "Active",
    }
}, {
    tableName: "clients",
    paranoid: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
});

module.exports = Client;
