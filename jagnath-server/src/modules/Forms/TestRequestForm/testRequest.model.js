/**
 * @file testRequest.model.js
 * @description Sequelize model for TestRequests.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const TestRequest = sequelize.define("TestRequest", {
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
    clientId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: "clients",
            key: "id",
        }
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    locationOfSample: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    contactPerson: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    contactNumber: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    dateOfCollection: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    dateOfReceipt: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    sampleCollectedBy: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    sampleQuantity: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    fieldDataSheet: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    packingDetails: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    sampleIdNumber: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    reportNumber: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    sampleParticular: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    categoryId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: "categories",
            key: "id"
        },
        field: "category_id"
    },
    equipmentAvailability: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    referenceStandardAvailability: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    sampleAdequacy: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    testMethodAvailability: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    trainedPersonAvailability: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    reportIssueDays: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    reviewedBy: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    customerRepresentativeSignature: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    sampleReceivedSignature: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    customerRepresentativeName: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    sampleReceiverName: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    testProtocol: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    formTitle: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    formType: {
        type: DataTypes.ENUM("NABL", "Regular"),
        defaultValue: "Regular",
        allowNull: false
    },
    includeCaution: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        field: "include_caution"
    },
    cautionId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: "caution_master",
            key: "id"
        },
        field: "caution_id"
    },
    subCategoryId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: "sub_categories",
            key: "id"
        },
        field: "sub_category_id"
    },
    status: {
        type: DataTypes.ENUM("Active", "Inactive"),
        defaultValue: "Active",
        allowNull: false,
    }
}, {
    tableName: "test_requests",
    paranoid: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
});

module.exports = TestRequest;
