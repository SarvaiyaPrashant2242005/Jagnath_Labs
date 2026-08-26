// Use native fetch

const test = async () => {
    try {
        // 1. Log in to get token
        const loginRes = await fetch("http://localhost:5000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "admin@jagnath.com",
                password: "admin@1122"
            })
        });
        const loginData = await loginRes.json();
        if (!loginData.success) {
            console.error("Login failed:", loginData);
            return;
        }
        const token = loginData.data.accessToken || loginData.data.token;
        console.log("Token retrieved successfully!");

        // 2. Fetch audit quotation by test request ID
        const trId = "a5a5cf5f-a648-4dc6-a7a0-018b9d991ccb";
        const res = await fetch(`http://localhost:5000/api/audit-quotation/test-request/${trId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        const data = await res.json();
        console.log("API RESPONSE STATUS:", res.status);
        console.log("API RESPONSE BODY:", JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Fetch error:", err);
    }
};

test();
