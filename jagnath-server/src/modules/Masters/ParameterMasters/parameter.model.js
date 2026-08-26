/**
 * @file parameter.model.js
 * @description Sequelize model for Parameters.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const Parameter = sequelize.define("Parameter", {
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
    subCategoryId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: "sub_categories",
            key: "id",
        }
    },
    locationSampleId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "location_sample_id",
        references: {
            model: "location_of_samples",
            key: "id",
        }
    },
    parameterName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    testMethod: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    unit: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    isPermissibleLimitApplicable: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        field: "is_permissible_limit_applicable"
    },
    permissibleLimit: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "permissible_limit"
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.00
    },
    status: {
        type: DataTypes.ENUM("Active", "Inactive"),
        defaultValue: "Active",
        allowNull: false,
    }
}, {
    tableName: "parameters",
    paranoid: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
});

module.exports = Parameter;
