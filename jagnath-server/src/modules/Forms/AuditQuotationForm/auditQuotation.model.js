/**
 * @file auditQuotation.model.js
 * @description Sequelize model for Audit Quotations.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const AuditQuotation = sequelize.define("AuditQuotation", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    testRequestId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: {
            model: "test_requests",
            key: "id",
        },
        field: "test_request_id"
    },
    companyId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: "companies",
            key: "id",
        },
        field: "company_id"
    },
    clientId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: "clients",
            key: "id",
        },
        field: "client_id"
    },
    quotationNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "quotation_number"
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
    reference: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "reference"
    },
    subject: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "subject"
    },
    introText: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "intro_text"
    },
    accreditationText: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "accreditation_text"
    },
    scopeText: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "scope_text"
    },
    termsText: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "terms_text"
    },
    charges: {
        type: DataTypes.TEXT, // Text field storing serialized JSON array of charge items
        allowNull: true,
        get() {
            const rawValue = this.getDataValue("charges");
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue("charges", value ? JSON.stringify(value) : "[]");
        }
    },
    annexure: {
        type: DataTypes.TEXT, // Text field storing serialized JSON array of annexure rate items
        allowNull: true,
        get() {
            const rawValue = this.getDataValue("annexure");
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue("annexure", value ? JSON.stringify(value) : "[]");
        }
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
    status: {
        type: DataTypes.STRING(50),
        defaultValue: "Active",
        allowNull: false,
    }
}, {
    tableName: "audit_quotations",
    paranoid: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
});

module.exports = AuditQuotation;
