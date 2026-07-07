/**
 * @file user_companies.model.js
 * @description Mapping table connecting Users to Companies.
 */
const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");
const Users = require("../../Auth/Users/users.model");
const Company = require("./company.model");

const UserCompanies = sequelize.define("UserCompanies", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Users,
            key: "id",
        }
    },
    company_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Company,
            key: "id",
        }
    },
    is_default: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    tableName: "user_companies",
    paranoid: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
});

module.exports = UserCompanies;
