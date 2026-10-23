/**
 * @file auditQuotation.controller.js
 * @description Express controller for handling Audit Quotation CRUD actions.
 */

const auditQuotationService = require("./auditQuotation.service");
const TestRequest = require("../TestRequestForm/testRequest.model");
const { createAuditQuotationSchema, updateAuditQuotationSchema } = require("./auditQuotation.validators");

/**
 * Fetch or initialize default Audit Quotation for a specific TestRequest.
 */
const getByTestRequestId = async (req, res) => {
    try {
        const { testRequestId } = req.params;

        // If quotation already exists, return it immediately
        const existing = await auditQuotationService.findByTestRequestId(testRequestId);
        if (existing) {
            return res.status(200).json({
                success: true,
                data: existing
            });
        }

        // Otherwise check the TestRequest to initialize
        const tr = await TestRequest.findByPk(testRequestId);
        if (!tr) {
            return res.status(404).json({
                success: false,
                message: "Test Request not found."
            });
        }

        // Ensure TRF is marked as requiring Audit Quotation when initialized
        if (tr.quotationRequired !== "Yes" || tr.quotationType !== "Audit") {
            await tr.update({ quotationRequired: "Yes", quotationType: "Audit" });
        }

        const quotation = await auditQuotationService.getOrInitializeQuotation(testRequestId);
        return res.status(200).json({
            success: true,
            data: quotation
        });
    } catch (error) {
        console.error("Error in getByTestRequestId:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to load/initialize Audit Quotation."
        });
    }
};

/**
 * Save / Create Audit Quotation.
 */
const saveQuotation = async (req, res) => {
    try {
        const { error, value } = createAuditQuotationSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        // Validate the TestRequest
        const tr = await TestRequest.findByPk(value.testRequestId);
        if (!tr) {
            return res.status(404).json({
                success: false,
                message: "Test Request not found."
            });
        }

        if (tr.quotationRequired !== "Yes" || tr.quotationType !== "Audit") {
            await tr.update({ quotationRequired: "Yes", quotationType: "Audit" });
        }

        const quotation = await auditQuotationService.getOrInitializeQuotation(value.testRequestId);
        const updated = await auditQuotationService.updateQuotation(quotation.id, value);

        return res.status(200).json({
            success: true,
            message: "Audit Quotation saved successfully.",
            data: updated
        });
    } catch (error) {
        console.error("Error in saveQuotation:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to save Audit Quotation."
        });
    }
};

/**
 * Update Audit Quotation by ID.
 */
const updateQuotation = async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = updateAuditQuotationSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const updated = await auditQuotationService.updateQuotation(id, value);
        return res.status(200).json({
            success: true,
            message: "Audit Quotation updated successfully.",
            data: updated
        });
    } catch (error) {
        console.error("Error in updateQuotation:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update Audit Quotation."
        });
    }
};

module.exports = {
    getByTestRequestId,
    saveQuotation,
    updateQuotation
};
