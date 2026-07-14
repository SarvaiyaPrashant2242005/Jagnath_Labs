const bcrypt = require("bcrypt");
const db = require("./index");

/**
 * Seeds a default user if it does not already exist.
 */
const seedDefaultUser = async () => {
    try {
        const defaultEmail = "prashanthere90@gmail.com";
        const existingUser = await db.Users.findOne({ where: { email: defaultEmail } });

        if (!existingUser) {
            const hashedPassword = await bcrypt.hash("qwerty12", 10);
            await db.Users.create({
                name: "Prashant Sarvaiya",
                email: defaultEmail,
                password: hashedPassword,
                status: "Active"
            });
            console.log("✅ Default user created successfully.");
        } else {
            console.log("ℹ️ Default user already exists.");
        }
    } catch (error) {
        console.error("❌ Error seeding default user:", error.message);
    }
};

module.exports = { seedDefaultUser };
