/**
 * @file client.model.js
 * @description Sequelize model for Clients.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const Client = sequelize.define("Client", {
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
    clientName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    contactPerson: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "contact_person"
    },
    contactNumber: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    gstNo: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "gst_no"
    },
    udyamNo: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "udyam_no"
    },
    workOrderNo: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "work_order_no",
        set(val) {
            if (val === undefined || val === null || String(val).trim() === '') {
                this.setDataValue('workOrderNo', null);
            } else {
                this.setDataValue('workOrderNo', String(val).trim());
            }
        }
    },
    workOrderDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: "work_order_date",
        set(val) {
            if (!val || String(val).trim() === '' || String(val).toLowerCase() === 'invalid date' || String(val).toLowerCase() === 'null') {
                this.setDataValue('workOrderDate', null);
            } else {
                const d = new Date(val);
                if (isNaN(d.getTime())) {
                    this.setDataValue('workOrderDate', null);
                } else {
                    this.setDataValue('workOrderDate', d.toISOString().slice(0, 10));
                }
            }
        }
    },
    officeAddress: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "office_address",
        defaultValue: "N/A"
    },
    plantAddress: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "plant_address",
        defaultValue: "N/A"
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    city: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    state: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    gender: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM("Active", "Inactive"),
        defaultValue: "Active",
    }
}, {
    tableName: "clients",
    paranoid: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
});

module.exports = Client;
