/**
 * @file testRequestParameter.model.js
 * @description Sequelize model for TestRequestParameters.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const TestRequestParameter = sequelize.define("TestRequestParameter", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    testRequestId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: "test_requests",
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
    testMethod: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    unit: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    result: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
    remark: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
    },
    sequence: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: "Pending",
        allowNull: false,
    },
    enteredBy: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    enteredAt: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    groupId: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: "group_id"
    },
    locationOfSample: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: "location_of_sample"
    },
    departmentId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "department_id"
    },
    categoryId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "category_id"
    },
    subCategoryId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "sub_category_id"
    }
}, {
    tableName: "test_request_parameters",
    paranoid: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
});

module.exports = TestRequestParameter;
