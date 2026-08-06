/**
 * @file dashboard.controller.js
 * @description HTTP Controller for Dashboard endpoints.
 */
const dashboardService = require("./dashboard.service");
const companyService = require("../Masters/CompanyMasters/company.service");
const Company = require("../Masters/CompanyMasters/company.model");
const { successResponse, errorResponse } = require("../../utils/response");

const resolveCompanyId = async (body, query, userId, headers = {}, reqUser = {}) => {
    const isSuperAdmin = reqUser?.role === "SuperAdmin" || reqUser?.role === "SUPER_ADMIN" || reqUser?.email === "admin@jagnath.com";
    const companyIdVal = body?.companyId || body?.company_id || query?.companyId || query?.company_id || headers?.["x-company-id"];

    if (companyIdVal && companyIdVal !== 'null' && companyIdVal !== 'undefined') {
        const comp = await Company.findByPk(companyIdVal);
        if (comp) return comp.id;
    }

    const company = await companyService.getCompanyByUserId(userId);
    if (company) return company.id;

    const companies = await companyService.getCompaniesByUser(userId, { isSuperAdmin });
    if (companies && companies.length > 0) return companies[0].id;

    const anyComp = await Company.findOne();
    if (anyComp) return anyComp.id;

    return null;
};

const getStats = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const companyId = await resolveCompanyId(req.body, req.query, userId, req.headers, req.user);

        const stats = await dashboardService.getDashboardStats(companyId);
        return res.status(200).json(successResponse("DASHBOARD_STATS_FETCHED", "Dashboard statistics fetched successfully.", "Dashboard data loaded.", stats));
    } catch (err) {
        console.error("Dashboard stats error:", err);
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to load dashboard statistics."));
    }
};

module.exports = {
    getStats
};
