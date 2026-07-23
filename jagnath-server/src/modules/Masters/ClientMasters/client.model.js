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
    address: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    city: {
        type: DataTypes.STRING,
        allowNull: false,
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
