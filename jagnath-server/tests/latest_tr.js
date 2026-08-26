const connectDB = require("../src/config/dbConnection");
const TestRequest = require("../src/modules/Forms/TestRequestForm/testRequest.model");
const Client = require("../src/modules/Masters/ClientMasters/client.model");

const check = async () => {
    try {
        await connectDB();
        const latest = await TestRequest.findAll({
            limit: 5,
            order: [["created_at", "DESC"]],
            include: [{ model: Client, as: "client" }]
        });
        console.log("=== LATEST 5 TEST REQUESTS ===");
        latest.forEach(tr => {
            console.log(`ID: ${tr.id}`);
            console.log(`  Client: ${tr.client?.clientName}`);
            console.log(`  Quotation Required: ${tr.quotationRequired}`);
            console.log(`  Quotation Type: ${tr.quotationType}`);
            console.log(`  Created At: ${tr.created_at}`);
            console.log(`-----------------------------------`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
};

check();
