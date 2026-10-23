/**
 * @file regularQuotation.model.js
 * @description Sequelize model for Regular Quotations (Table: regular_quotations).
 * Dedicated database table for Regular Quotations.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const RegularQuotation = sequelize.define("RegularQuotation", {
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
        },
        field: "company_id"
    },
    clientId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: "clients",
            key: "id",
        },
        field: "client_id"
    },
    testRequestId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: "test_requests",
            key: "id",
        },
        field: "test_request_id"
    },
    quotationNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "quotation_number"
    },
    quotationType: {
        type: DataTypes.STRING,
        defaultValue: "Regular Quotation",
        allowNull: false,
        field: "quotation_type"
    },
    categoryType: {
        type: DataTypes.STRING,
        defaultValue: "regular",
        allowNull: true,
        field: "category_type"
    },
    quotationDate: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "quotation_date"
    },
    revisedDate: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "revised_date"
    },
    financialYear: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "financial_year"
    },
    referenceNo: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "reference_no"
    },
    qpiNo: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "qpi_no"
    },
    clientName: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "client_name"
    },
    plantName: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "plant_name"
    },
    plantAddress: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "plant_address"
    },
    industryType: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "industry_type"
    },
    subtotal: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
        field: "subtotal"
    },
    discount: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
        field: "discount"
    },
    taxableAmount: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
        field: "taxable_amount"
    },
    gstPercentage: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 18.00,
        field: "gst_percentage"
    },
    gstAmount: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
        field: "gst_amount"
    },
    grandTotal: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
        field: "grand_total"
    },
    status: {
        type: DataTypes.STRING(50),
        defaultValue: "Draft",
        allowNull: false,
        field: "status"
    },
    version: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        allowNull: false,
        field: "version"
    },
    previousVersionId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "previous_version_id"
    },
    contactPerson: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "contact_person"
    },
    signatoryName: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "signatory_name"
    },
    signatoryDesignation: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "signatory_designation"
    },
    signatorySignature: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "signatory_signature"
    },
    stampImage: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "stamp_image"
    },
    quotationData: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "quotation_data",
        get() {
            const raw = this.getDataValue("quotationData");
            if (!raw) return {};
            try {
                return JSON.parse(raw);
            } catch (e) {
                return {};
            }
        },
        set(value) {
            this.setDataValue("quotationData", value ? JSON.stringify(value) : "{}");
        }
    }
}, {
    tableName: "regular_quotations",
    paranoid: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
});

module.exports = RegularQuotation;
