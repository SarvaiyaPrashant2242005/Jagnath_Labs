/**
 * @file dashboard.service.js
 * @description Business logic for Dashboard real-time statistics & laboratory analytics.
 */
const db = require("../../database");
const { TestRequest, TestReport, Client, Parameter, Category, SubCategory, LocationSample } = db;
const { Op } = require("sequelize");
const sequelize = db.sequelize;

const getDashboardStats = async (companyId) => {
    const whereCompany = companyId ? { companyId } : {};

    // 1. Core Total KPI Counts
    const [
        totalTestRequests,
        totalTestReports,
        totalClients,
        totalParameters,
        totalCategories,
        totalSubCategories,
        totalLocations
    ] = await Promise.all([
        TestRequest.count({ where: whereCompany }),
        TestReport.count({ where: whereCompany }),
        Client.count({ where: whereCompany }),
        Parameter.count({ where: whereCompany }),
        Category.count({ where: whereCompany }),
        SubCategory.count({ where: whereCompany }),
        LocationSample.count({ where: whereCompany })
    ]);

    // 2. Recent Test Requests (Latest 6)
    const rawRecentRequests = await TestRequest.findAll({
        where: whereCompany,
        order: [['created_at', 'DESC']],
        limit: 6,
        include: [
            { model: Client, as: "client", attributes: ["id", "clientName", "email", "contactNumber"] },
            { model: Category, as: "category", attributes: ["id", "name"] },
            { model: SubCategory, as: "subCategory", attributes: ["id", "name"] }
        ]
    });

    const recentTestRequests = rawRecentRequests.map(tr => {
        const item = tr.toJSON();
        return {
            id: item.id,
            reportNumber: item.reportNumber || `TR #${item.id.slice(0, 8)}`,
            clientName: item.client ? (item.client.clientName || item.client.client_name) : 'N/A',
            formTitle: item.formTitle || item.sampleParticular || 'N/A',
            dateOfReceipt: item.dateOfReceipt || item.dateOfCollection || item.createdAt,
            formType: item.formType || 'Regular',
            categoryName: item.category ? item.category.name : 'N/A',
            subCategoryName: item.subCategory ? item.subCategory.name : 'N/A',
            status: item.status || 'Active',
            createdAt: item.createdAt
        };
    });

    // 3. Recent Test Reports (Latest 6)
    const rawRecentReports = await TestReport.findAll({
        where: whereCompany,
        order: [['created_at', 'DESC']],
        limit: 6
    });

    const recentTestReports = rawRecentReports.map(tr => {
        const item = tr.toJSON();
        return {
            id: item.id,
            reportNumber: item.reportNumber || 'N/A',
            reportIssuedTo: item.reportIssuedTo || item.agencyName || 'N/A',
            nameOfWork: item.nameOfWork || 'N/A',
            dateOfReceipt: item.dateOfReceipt || item.startingDateOfTest || item.createdAt,
            startingDateOfTest: item.startingDateOfTest || 'N/A',
            completionDateOfTest: item.completionDateOfTest || 'N/A',
            status: item.status || 'Completed',
            createdAt: item.createdAt
        };
    });

    // 4. Category Breakdown with Count of Test Requests & Parameters
    const categories = await Category.findAll({
        where: whereCompany,
        attributes: ["id", "name"],
        order: [["name", "ASC"]]
    });

    const categoryBreakdown = await Promise.all(categories.map(async (cat) => {
        const trCount = await TestRequest.count({
            where: { ...whereCompany, categoryId: cat.id }
        });
        return {
            id: cat.id,
            name: cat.name,
            testRequestCount: trCount
        };
    }));

    // Sort category breakdown by test request count descending
    categoryBreakdown.sort((a, b) => b.testRequestCount - a.testRequestCount);

    // 5. Monthly Trends (Last 6 Months)
    const monthlyTrends = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        const monthLabel = monthDate.toLocaleString('default', { month: 'short' });

        const [trCount, repCount] = await Promise.all([
            TestRequest.count({
                where: {
                    ...whereCompany,
                    created_at: {
                        [Op.gte]: monthDate,
                        [Op.lt]: nextMonthDate
                    }
                }
            }),
            TestReport.count({
                where: {
                    ...whereCompany,
                    created_at: {
                        [Op.gte]: monthDate,
                        [Op.lt]: nextMonthDate
                    }
                }
            })
        ]);

        monthlyTrends.push({
            month: monthLabel,
            testRequests: trCount,
            testReports: repCount
        });
    }

    return {
        counts: {
            totalTestRequests,
            totalTestReports,
            totalClients,
            totalParameters,
            totalCategories,
            totalSubCategories,
            totalLocations
        },
        recentTestRequests,
        recentTestReports,
        categoryBreakdown,
        monthlyTrends
    };
};

module.exports = {
    getDashboardStats
};
