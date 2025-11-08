
const bcrypt = require("bcrypt");

/**
 * @param {import("knex").Knex} knex
 */
exports.seed = async function (knex) {
  // Check if the super_admin role exists
  const superAdminRole = await knex("roles").where({ name: "super_admin" }).first();
  if (!superAdminRole) {
    console.log("Super Admin role not found. Please run the roles/permissions seed first.");
    return; // Don't exit process; Knex will continue
  }

  // Check if super admin user already exists
  const existing = await knex("admins").where({ email: "arunchauhan3303@gmail.com" }).first();
  if (existing) {
    console.log("Super Admin already exists:", existing.email);
    return;
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash("arun3303", 10);

  // Insert super admin
  const superAdmin = {
    name: "Arun Chauhan",
    email: "arunchauhan3303@gmail.com",
    password: hashedPassword,
    role_id: superAdminRole.id, // FK reference to roles
  };

  await knex("admins").insert(superAdmin);

  console.log("Super Admin created:", superAdmin.email);
};
