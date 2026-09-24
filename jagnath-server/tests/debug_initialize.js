const connectDB = require("../src/config/dbConnection");
const TestRequest = require("../src/modules/Forms/TestRequestForm/testRequest.model");
const auditQuotationService = require("../src/modules/Forms/AuditQuotationForm/auditQuotation.service");

const debug = async () => {
    try {
        await connectDB();
        
        // Find a test request with quotation required Yes and type Audit
        const tr = await TestRequest.findOne({
            where: {
                quotationRequired: "Yes",
                quotationType: "Audit"
            }
        });

        if (!tr) {
            console.log("No TestRequest with quotationRequired = Yes and quotationType = Audit found in the database. Creating one...");
            const newTr = await TestRequest.create({
                companyId: "c2cde15d-007e-49b0-a3ee-0d85942478a5", // Let's check a valid company/client UUID
                clientId: "d2dbe15d-007e-49b0-a3ee-0d85942478a5",
                quotationRequired: "Yes",
                quotationType: "Audit"
            });
            console.log("Created dummy test request:", newTr.id);
            const q = await auditQuotationService.getOrInitializeQuotation(newTr.id);
            console.log("Initialized quotation successfully:", q.id);
        } else {
            console.log("Found TestRequest:", tr.id);
            const q = await auditQuotationService.getOrInitializeQuotation(tr.id);
            console.log("Initialized/Fetched quotation successfully:", q.id);
        }
    } catch (err) {
        console.error("DIAGNOSTIC ERROR DETECTED:", err);
    } finally {
        process.exit(0);
    }
};

debug();
