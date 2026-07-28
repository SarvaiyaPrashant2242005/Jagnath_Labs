const bcrypt = require("bcrypt");
const db = require("./index");

/**
 * Seeds a default user if it does not already exist.
 */
const seedDefaultUser = async () => {
    try {
        // 1. Seed Super Admin User
        const superAdminEmail = "admin@jagnath.com";
        let superAdmin = await db.Users.findOne({ where: { email: superAdminEmail } });

        if (!superAdmin) {
            const hashedPassword = await bcrypt.hash("admin@1122", 10);
            superAdmin = await db.Users.create({
                name: "Super Admin",
                email: superAdminEmail,
                password: hashedPassword,
                role: "SuperAdmin",
                status: "Active"
            });
            console.log("✅ Super Admin user created successfully (admin@jagnath.com).");
        } else {
            // Ensure password and role are updated if existing
            const hashedPassword = await bcrypt.hash("admin@1122", 10);
            await superAdmin.update({
                password: hashedPassword,
                role: "SuperAdmin",
                status: "Active"
            });
            console.log("ℹ️ Super Admin user updated (admin@jagnath.com).");
        }

        // 2. Seed Default User
        const defaultEmail = "prashanthere90@gmail.com";
        const existingUser = await db.Users.findOne({ where: { email: defaultEmail } });

        if (!existingUser) {
            const hashedPassword = await bcrypt.hash("qwerty12", 10);
            await db.Users.create({
                name: "Prashant Sarvaiya",
                email: defaultEmail,
                password: hashedPassword,
                role: "Admin",
                status: "Active"
            });
            console.log("✅ Default user created successfully.");
        }
    } catch (error) {
        console.error("❌ Error seeding users:", error.message);
    }
};

module.exports = { seedDefaultUser };
