/**
 * @file locationSample.model.js
 * @description Sequelize model for Location of Sample Master.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const LocationSample = sequelize.define("LocationSample", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
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
    name: {
        type: DataTypes.STRING(150),
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM("Active", "Inactive"),
        defaultValue: "Active",
        allowNull: false,
    },
    inlet: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
    outlet: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
    createdBy: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "created_by"
    },
    updatedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "updated_by"
    }
}, {
    tableName: "location_of_samples",
    paranoid: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
});

module.exports = LocationSample;
