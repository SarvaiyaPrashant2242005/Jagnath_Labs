/**
 * @file categoryParameterMapping.model.js
 * @description Sequelize model for Category-Parameter mappings.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const CategoryParameterMapping = sequelize.define("CategoryParameterMapping", {
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
    categoryId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: "categories",
            key: "id",
        }
    },
    parameterId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: "parameters",
            key: "id",
        }
    },
    sequence: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
    },
    status: {
        type: DataTypes.ENUM("Active", "Inactive"),
        defaultValue: "Active",
        allowNull: false,
    }
}, {
    tableName: "category_parameter_mappings",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
});

module.exports = CategoryParameterMapping;
