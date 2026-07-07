const express = require('express');
const router = express.Router();

const authRoutes = require('./modules/Auth/Users/users.routes');
const companyRoutes = require('./modules/Masters/CompanyMasters/company.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/company', companyRoutes);

module.exports = router;
