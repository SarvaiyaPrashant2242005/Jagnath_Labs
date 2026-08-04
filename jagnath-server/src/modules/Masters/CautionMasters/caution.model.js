/**
 * @file caution.model.js
 * @description Sequelize model for Caution Master.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const Caution = sequelize.define("Caution", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    companyId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: "companies",
            key: "id",
        }
    },
    title: {
        type: DataTypes.STRING(150),
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    reportType: {
        type: DataTypes.ENUM("REGULAR", "NABL", "BOTH"),
        defaultValue: "BOTH",
        allowNull: false,
        field: "report_type"
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
    },
    sortOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        allowNull: false,
        field: "sort_order"
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
    tableName: "caution_master",
    paranoid: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
});

module.exports = Caution;
