/**
 * @file index.js
 * @description Central database entry point. Consolidates the Sequelize client instance,
 * loads models, and registers database relationships/associations.
 * @module database/index
 * @requires config/database
 */

const sequelize = require("../config/database");

// Registry object to hold Sequelize, Sequelize constructors, and model definitions
const db = {};

// Attach the configured Sequelize client instance
db.sequelize = sequelize;

// Import Models
db.Users = require("../modules/Auth/Users/users.model");
db.RefreshTokens = require("../modules/Auth/RefreshTokens/refresh_tokens.model");
db.Company = require("../modules/Masters/CompanyMasters/company.model");
db.UserCompanies = require("../modules/Masters/CompanyMasters/user_companies.model");
db.Client = require("../modules/Masters/ClientMasters/client.model");
db.Parameter = require("../modules/Masters/ParameterMasters/parameter.model");
db.Category = require("../modules/Masters/CategoryMasters/category.model");
db.TestRequest = require("../modules/Forms/TestRequestForm/testRequest.model");

// Define Associations
db.Users.hasMany(db.RefreshTokens, { foreignKey: "user_id" });
db.RefreshTokens.belongsTo(db.Users, { foreignKey: "user_id" });

db.Users.belongsToMany(db.Company, { through: db.UserCompanies, foreignKey: "user_id" });
db.Company.belongsToMany(db.Users, { through: db.UserCompanies, foreignKey: "company_id" });

db.Users.hasOne(db.Company, { foreignKey: "userId", as: "company" });
db.Company.belongsTo(db.Users, { foreignKey: "userId", as: "user" });

db.Company.hasMany(db.Client, { foreignKey: "companyId", as: "clients" });
db.Client.belongsTo(db.Company, { foreignKey: "companyId", as: "company" });

db.Company.hasMany(db.Parameter, { foreignKey: "companyId", as: "parameters" });
db.Parameter.belongsTo(db.Company, { foreignKey: "companyId", as: "company" });

db.Company.hasMany(db.Category, { foreignKey: "companyId", as: "categories" });
db.Category.belongsTo(db.Company, { foreignKey: "companyId", as: "company" });

db.Company.hasMany(db.TestRequest, { foreignKey: "companyId", as: "testRequests" });
db.TestRequest.belongsTo(db.Company, { foreignKey: "companyId", as: "company" });

db.Client.hasMany(db.TestRequest, { foreignKey: "clientId", as: "testRequests" });
db.TestRequest.belongsTo(db.Client, { foreignKey: "clientId", as: "client" });

module.exports = db;