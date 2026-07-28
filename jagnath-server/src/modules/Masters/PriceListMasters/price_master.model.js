/**
 * @file price_master.model.js
 * @description Sequelize model for simple Price Master (parameter testing rates).
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const PriceMaster = sequelize.define("PriceMaster", {
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
    categoryId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "category_id",
        references: {
            model: "categories",
            key: "id",
        }
    },
    parameterId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "parameter_id",
        references: {
            model: "parameters",
            key: "id",
        }
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    status: {
        type: DataTypes.ENUM("Active", "Inactive"),
        defaultValue: "Active",
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
    tableName: "price_master",
    paranoid: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
    indexes: [
        {
            unique: true,
            fields: ["company_id", "category_id", "parameter_id"],
            name: "unique_company_category_parameter_price"
        }
    ]
});

module.exports = PriceMaster;
