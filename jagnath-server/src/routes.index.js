const express = require('express');
const router = express.Router();

const authRoutes = require('./modules/Auth/Users/users.routes');
const companyRoutes = require('./modules/Masters/CompanyMasters/company.routes');
const clientRoutes = require('./modules/Masters/ClientMasters/client.routes');
const parameterRoutes = require('./modules/Masters/ParameterMasters/parameter.routes');
const categoryRoutes = require('./modules/Masters/CategoryMasters/category.routes');
const testRequestRoutes = require('./modules/Forms/TestRequestForm/testRequest.routes');
const categoryParameterRoutes = require('./modules/Masters/CategoryParameterMasters/categoryParameter.routes');
const testRequestParameterRoutes = require('./modules/Transactions/TestRequestParameters/testRequestParameter.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/company', companyRoutes);
router.use('/client', clientRoutes);
router.use('/parameter', parameterRoutes);
router.use('/category', categoryRoutes);
router.use('/test-request', testRequestRoutes);
router.use('/category-parameter', categoryParameterRoutes);
router.use('/test-request-parameter', testRequestParameterRoutes);

module.exports = router;
