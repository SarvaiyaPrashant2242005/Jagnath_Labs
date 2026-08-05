const express = require('express');
const router = express.Router();

const authRoutes = require('./modules/Auth/Users/users.routes');
const companyRoutes = require('./modules/Masters/CompanyMasters/company.routes');
const clientRoutes = require('./modules/Masters/ClientMasters/client.routes');
const parameterRoutes = require('./modules/Masters/ParameterMasters/parameter.routes');
const categoryRoutes = require('./modules/Masters/CategoryMasters/category.routes');
const testRequestRoutes = require('./modules/Forms/TestRequestForm/testRequest.routes');
const testReportRoutes = require('./modules/Forms/TestReportForm/testReport.routes');
const categoryParameterRoutes = require('./modules/Masters/CategoryParameterMasters/categoryParameter.routes');
const testRequestParameterRoutes = require('./modules/Transactions/TestRequestParameters/testRequestParameter.routes');
const priceMasterRoutes = require('./modules/Masters/PriceListMasters/priceMaster.routes');
const cautionRoutes = require('./modules/Masters/CautionMasters/caution.routes');
const subCategoryRoutes = require('./modules/Masters/SubCategoryMasters/subCategory.routes');
const locationSampleRoutes = require('./modules/Masters/LocationSampleMasters/locationSample.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/company', companyRoutes);
router.use('/client', clientRoutes);
router.use('/parameter', parameterRoutes);
router.use('/category', categoryRoutes);
router.use('/sub-category', subCategoryRoutes);
router.use('/location-sample', locationSampleRoutes);
router.use('/test-request', testRequestRoutes);
router.use('/test-report', testReportRoutes);
router.use('/category-parameter', categoryParameterRoutes);
router.use('/test-request-parameter', testRequestParameterRoutes);
router.use('/test-request-parameters', testRequestParameterRoutes);
router.use('/price-master', priceMasterRoutes);
router.use('/price-list', priceMasterRoutes);
router.use('/caution', cautionRoutes);

module.exports = router;
