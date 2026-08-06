/**
 * @file testReport.model.js
 * @description Sequelize model for Test Reports.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const TestReport = sequelize.define("TestReport", {
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
    testRequestId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "test_request_id"
    },
    reportNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "report_number"
    },
    referenceNo: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "reference_no"
    },
    reportIssuedTo: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "report_issued_to"
    },
    agencyName: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "agency_name"
    },
    agencyAddress: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "agency_address"
    },
    detailsOfSample: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "details_of_sample"
    },
    packingDetails: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "packing_details"
    },
    dateOfReceipt: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: "date_of_receipt"
    },
    sampleQuantity: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "sample_quantity"
    },
    samplingLocation: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "sampling_location"
    },
    conditionOnReceipt: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "condition_on_receipt"
    },
    sampleCollectedBy: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "sample_collected_by"
    },
    nameOfWork: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "name_of_work"
    },
    startingDateOfTest: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: "starting_date_of_test"
    },
    completionDateOfTest: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: "completion_date_of_test"
    },
    sectionHeader: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "section_header"
    },
    formatNo: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "format_no"
    },
    formatDate: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "format_date"
    },
    reviewedBy: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "reviewed_by"
    },
    authorizedSignatory: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "authorized_signatory"
    },
    parametersList: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: [],
        field: "parameters_list"
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: "Completed",
        allowNull: false,
    }
}, {
    tableName: "test_reports",
    paranoid: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
});

module.exports = TestReport;
