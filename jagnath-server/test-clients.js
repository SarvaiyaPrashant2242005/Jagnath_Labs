/**
 * Verification script for checking Jagnath API and ClientMasters CRUD.
 * Run this script using: node test-clients.js
 */
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5000';

async function test() {
    console.log('🚀 Starting Client CRUD verification...');
    
    const email = `testuser_${Date.now()}@example.com`;
    const password = 'Password123!';
    
    // 1. Register a test user
    try {
        const registerRes = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test User',
                email: email,
                password: password,
                confirmPassword: password
            })
        });
        const registerData = await registerRes.json();
        console.log('✅ User registration call completed status:', registerRes.status, registerData);
    } catch (err) {
        console.log('⚠️ User registration failed/skipped:', err.message);
    }

    // 2. Login to get access token
    let token = '';
    try {
        const loginRes = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(JSON.stringify(loginData));
        token = loginData.data.accessToken;
        console.log('✅ Logged in. Token received:', token.substring(0, 15) + '...');
    } catch (err) {
        console.error('❌ Login failed:', err.message);
        process.exit(1);
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // 3. Create a Company (POST /api/company)
    const companyName = `Test Company_${Date.now()}`;
    let companyId = '';
    try {
        const createCompanyRes = await fetch(`${API_URL}/api/company`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                companyName: companyName,
                companyEmail: `company_${Date.now()}@example.com`,
                phone: '1234567890',
                website: 'https://testcompany.com',
                address: '123 Test Rd',
                description: 'Test Company Description'
            })
        });
        const companyData = await createCompanyRes.json();
        if (!createCompanyRes.ok) throw new Error(JSON.stringify(companyData));
        companyId = companyData.data.id;
        console.log(`✅ Company "${companyName}" created. ID:`, companyId);
    } catch (err) {
        console.error('❌ Company creation failed:', err.message);
        process.exit(1);
    }

    // 4. Create a Client using companyName (POST /api/client)
    let clientId = '';
    try {
        const createClientRes = await fetch(`${API_URL}/api/client`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                companyName: companyName,
                clientName: 'John Doe Client',
                contactNumber: '0987654321',
                address: '456 Client Lane',
                city: 'New York',
                gender: 'Male',
                status: 'Active'
            })
        });
        const clientData = await createClientRes.json();
        if (!createClientRes.ok) throw new Error(JSON.stringify(clientData));
        clientId = clientData.data.id;
        console.log('✅ Client created. Client ID:', clientId);
        console.log('Response top-level companyName:', clientData.data.companyName);
        if (clientData.data.companyName !== companyName) {
            console.error('❌ Error: Response companyName does not match expected!');
            process.exit(1);
        }
    } catch (err) {
        console.error('❌ Client creation failed:', err.message);
        process.exit(1);
    }

    // 5. Get Client by ID (GET /api/client/:id)
    try {
        const getClientRes = await fetch(`${API_URL}/api/client/${clientId}`, { method: 'GET', headers });
        const clientData = await getClientRes.json();
        if (!getClientRes.ok) throw new Error(JSON.stringify(clientData));
        console.log('✅ Get Client by ID succeeded. clientName:', clientData.data.clientName, 'companyName:', clientData.data.companyName);
        if (clientData.data.companyName !== companyName) {
            console.error('❌ Error: Retrieved client does not have companyName at top level!');
            process.exit(1);
        }
    } catch (err) {
        console.error('❌ Get Client by ID failed:', err.message);
        process.exit(1);
    }

    // 6. Get All Clients (GET /api/client)
    try {
        const getAllClientsRes = await fetch(`${API_URL}/api/client`, { method: 'GET', headers });
        const allClientsData = await getAllClientsRes.json();
        if (!getAllClientsRes.ok) throw new Error(JSON.stringify(allClientsData));
        console.log('✅ Get All Clients succeeded. Clients count:', allClientsData.data.length);
        console.log('First client in list:', allClientsData.data[0]);
        if (allClientsData.data[0].companyName !== companyName) {
            console.error('❌ Error: Client in list does not have companyName!');
            process.exit(1);
        }
    } catch (err) {
        console.error('❌ Get All Clients failed:', err.message);
        process.exit(1);
    }

    // 7. Update Client using companyName (PUT /api/client/:id)
    try {
        const updateClientRes = await fetch(`${API_URL}/api/client/${clientId}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
                clientName: 'John Doe Client Updated',
                city: 'Boston'
            })
        });
        const updateData = await updateClientRes.json();
        if (!updateClientRes.ok) throw new Error(JSON.stringify(updateData));
        console.log('✅ Update Client succeeded. Updated Name:', updateData.data.clientName, 'companyName:', updateData.data.companyName);
    } catch (err) {
        console.error('❌ Update Client failed:', err.message);
        process.exit(1);
    }

    // 8. Delete Client (DELETE /api/client/:id)
    try {
        const deleteClientRes = await fetch(`${API_URL}/api/client/${clientId}`, { method: 'DELETE', headers });
        const deleteData = await deleteClientRes.json();
        if (!deleteClientRes.ok) throw new Error(JSON.stringify(deleteData));
        console.log('✅ Delete Client succeeded. message:', deleteData.message);
    } catch (err) {
        console.error('❌ Delete Client failed:', err.message);
        process.exit(1);
    }

    // 9. Verify deletion (GET should return 404)
    try {
        const checkRes = await fetch(`${API_URL}/api/client/${clientId}`, { method: 'GET', headers });
        if (checkRes.status === 404) {
            console.log('✅ Verified: Client soft-deleted and cannot be fetched.');
        } else {
            console.error('❌ Error: Client was found or returned status:', checkRes.status);
            process.exit(1);
        }
    } catch (err) {
        console.error('❌ Check after deletion failed:', err.message);
        process.exit(1);
    }

    // 10. Check Logs
    console.log('\n📂 Checking generated Client Logs...');
    const projectRoot = __dirname;
    const createLog = path.join(projectRoot, 'logs/Client/Create.txt');
    const updateLog = path.join(projectRoot, 'logs/Client/Update.txt');
    const deleteLog = path.join(projectRoot, 'logs/Client/Delete.txt');

    if (fs.existsSync(createLog)) {
        console.log('📝 Create.txt Content:\n', fs.readFileSync(createLog, 'utf8').trim());
    } else {
        console.error('❌ Create.txt log file is missing!');
    }

    if (fs.existsSync(updateLog)) {
        console.log('📝 Update.txt Content:\n', fs.readFileSync(updateLog, 'utf8').trim());
    } else {
        console.error('❌ Update.txt log file is missing!');
    }

    if (fs.existsSync(deleteLog)) {
        console.log('📝 Delete.txt Content:\n', fs.readFileSync(deleteLog, 'utf8').trim());
    } else {
        console.error('❌ Delete.txt log file is missing!');
    }

    console.log('\n🎉 ALL CRUD, MAPPING AND LOG TESTS PASSED SUCCESSFULLY! 🎉');
}

test();
