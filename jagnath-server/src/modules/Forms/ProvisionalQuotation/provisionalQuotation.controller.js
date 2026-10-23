/**
 * @file provisionalQuotation.controller.js
 * @description Express controller for Provisional and General Quotations.
 */

const provisionalQuotationService = require("./provisionalQuotation.service");
const { saveProvisionalQuotationSchema } = require("./provisionalQuotation.validators");

const getAllQuotations = async (req, res) => {
  try {
    const result = await provisionalQuotationService.getAllQuotations({
      ...req.query,
      companyId: req.user?.companyId || req.query.companyId
    });

    return res.status(200).json({
      success: true,
      data: result.quotations,
      total: result.total
    });
  } catch (error) {
    console.error("Error in getAllQuotations:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load quotations."
    });
  }
};

const getQuotationById = async (req, res) => {
  try {
    const { id } = req.params;
    const quotation = await provisionalQuotationService.getQuotationById(id);
    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found."
      });
    }

    return res.status(200).json({
      success: true,
      data: quotation
    });
  } catch (error) {
    console.error("Error in getQuotationById:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load quotation."
    });
  }
};

const saveQuotation = async (req, res) => {
  try {
    const { error, value } = saveProvisionalQuotationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const saved = await provisionalQuotationService.saveQuotationSnapshot(
      value,
      req.user?.companyId
    );

    return res.status(200).json({
      success: true,
      message: "Quotation saved successfully.",
      data: saved
    });
  } catch (error) {
    console.error("Error in saveQuotation:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to save quotation."
    });
  }
};

const deleteQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    await provisionalQuotationService.deleteQuotation(id);

    return res.status(200).json({
      success: true,
      message: "Quotation deleted successfully."
    });
  } catch (error) {
    console.error("Error in deleteQuotation:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete quotation."
    });
  }
};

const duplicateQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const duplicated = await provisionalQuotationService.duplicateQuotation(id);
    if (!duplicated) {
      return res.status(404).json({
        success: false,
        message: "Source quotation not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Quotation duplicated successfully.",
      data: duplicated
    });
  } catch (error) {
    console.error("Error in duplicateQuotation:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to duplicate quotation."
    });
  }
};

const createQuotationRevision = async (req, res) => {
  try {
    const { id } = req.params;
    const { changeSummary } = req.body;
    const revised = await provisionalQuotationService.createQuotationRevision(id, changeSummary);
    if (!revised) {
      return res.status(404).json({
        success: false,
        message: "Source quotation not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Quotation revision created successfully.",
      data: revised
    });
  } catch (error) {
    console.error("Error in createQuotationRevision:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create revision."
    });
  }
};

module.exports = {
  getAllQuotations,
  getQuotationById,
  saveQuotation,
  deleteQuotation,
  duplicateQuotation,
  createQuotationRevision
};
