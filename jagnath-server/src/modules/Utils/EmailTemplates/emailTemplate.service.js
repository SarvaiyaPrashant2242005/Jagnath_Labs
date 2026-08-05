/**
 * @file emailTemplate.service.js
 * @description Business logic for Email Templates operations.
 */

const EmailTemplate = require("./emailTemplate.model");
const Company = require("../../Masters/CompanyMasters/company.model");
const { Op } = require("sequelize");

const DEFAULT_TEMPLATES = [
    {
        templateType: "TEST_REQUEST",
        name: "Test Request Email Template",
        subject: "Test Request Acknowledgement - {reportNumber}",
        body: `<p>Dear <strong>{clientName}</strong>,</p>
<p>Thank you for submitting your testing sample with <strong>{companyName}</strong>.</p>
<p>We have received your request for sample <strong>{detailsOfSample}</strong> under Report/Reference No: <strong>{reportNumber}</strong> on <strong>{date}</strong>.</p>
<p>Please find attached the official Test Request Form (TRF) PDF for your reference and records.</p>
<br/>
<p>Best regards,<br/><strong>{companyName}</strong><br/>Laboratory Operations Team</p>`
    },
    {
        templateType: "TEST_REPORT",
        name: "Test Report Email Template",
        subject: "Final Test Analysis Report - {reportNumber}",
        body: `<p>Dear <strong>{clientName}</strong>,</p>
<p>We are pleased to inform you that testing for sample <strong>{detailsOfSample}</strong> has been completed successfully by <strong>{companyName}</strong>.</p>
<p>Report Number: <strong>{reportNumber}</strong><br/>Date of Receipt: <strong>{date}</strong></p>
<p>Please find the official Test Analysis Report attached in PDF format.</p>
<br/>
<p>Best regards,<br/><strong>{companyName}</strong><br/>Quality Assurance & Testing Department</p>`
    }
];

/**
 * Seed default email templates if none exist for company
 */
const seedDefaultTemplatesForCompany = async (companyId) => {
    try {
        if (!companyId) return;
        for (const defaultTpl of DEFAULT_TEMPLATES) {
            const existing = await EmailTemplate.findOne({
                where: { companyId, templateType: defaultTpl.templateType }
            });
            if (!existing) {
                await EmailTemplate.create({
                    ...defaultTpl,
                    companyId,
                    status: "Active"
                });
            }
        }
    } catch (err) {
        console.error("Error seeding default email templates:", err.message);
    }
};

const createEmailTemplate = async (data, companyId) => {
    const finalCompanyId = data.companyId || companyId;
    if (!finalCompanyId) {
        throw new Error("Company ID is required to create an Email Template.");
    }
    return await EmailTemplate.create({
        ...data,
        companyId: finalCompanyId
    });
};

const getAllEmailTemplates = async (query, companyId) => {
    const targetCompanyId = query.companyId || companyId;
    if (targetCompanyId) {
        await seedDefaultTemplatesForCompany(targetCompanyId);
    }

    const whereClause = {};
    if (targetCompanyId) {
        whereClause.companyId = targetCompanyId;
    }
    if (query.templateType) {
        whereClause.templateType = query.templateType;
    }
    if (query.status && query.status !== "ALL") {
        whereClause.status = query.status;
    }
    if (query.search) {
        whereClause[Op.or] = [
            { name: { [Op.iLike]: `%${query.search.trim()}%` } },
            { subject: { [Op.iLike]: `%${query.search.trim()}%` } },
            { templateType: { [Op.iLike]: `%${query.search.trim()}%` } }
        ];
    }

    const templates = await EmailTemplate.findAll({
        where: whereClause,
        order: [["id", "ASC"]]
    });

    return templates;
};

const getEmailTemplateById = async (id, companyId) => {
    const whereClause = { id };
    if (companyId) whereClause.companyId = companyId;
    const template = await EmailTemplate.findOne({ where: whereClause });
    if (!template) {
        throw new Error("Email Template not found.");
    }
    return template;
};

const updateEmailTemplate = async (id, data, companyId) => {
    const template = await getEmailTemplateById(id, companyId);
    await template.update(data);
    return template;
};

const deleteEmailTemplate = async (id, companyId) => {
    const template = await getEmailTemplateById(id, companyId);
    await template.destroy();
    return true;
};

module.exports = {
    seedDefaultTemplatesForCompany,
    createEmailTemplate,
    getAllEmailTemplates,
    getEmailTemplateById,
    updateEmailTemplate,
    deleteEmailTemplate
};
