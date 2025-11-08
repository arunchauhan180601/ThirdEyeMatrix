const { db } = require("../../config/db");
const bcrypt = require("bcrypt");

module.exports.getRoles = async (req, res) => {
  try {
    const roles = await db("roles").where("name", "!=", "super_admin").select("id","name");
    res.status(200).json({ message: "All users Role get Successfully", roles });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports.createUser = async (req, res) => {
  try {
    const { first_name, last_name, email, password, role_id } = req.body;

    const existingUser = await db("admin_users").where({ email }).first();
    if (existingUser) {
      return res.status(409).json({ message: "User with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db("admin_users")
      .insert({
        first_name,
        last_name,
        email,
        password: hashedPassword,
        role_id,
      })

    return res.status(201).json({ message: "User Created Successfully."});
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports.getAllUsers = async (req, res) => {
  try {
    const users = await db("admin_users")
      .join("roles", "admin_users.role_id", "=", "roles.id")
      .select(
        "admin_users.id",
        "admin_users.first_name",
        "admin_users.last_name",
        "admin_users.email",
        "roles.name as role_name",
        "admin_users.created_at"
      );
    res.status(200).json({ message: "All users fetched successfully", users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports.editUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, role_id } = req.body;

    const user = await db("admin_users").where({ id }).first();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await db("admin_users")
      .where({ id })
      .update({
        first_name,
        last_name,
        email,
        role_id,
        updated_at: db.fn.now(),
      });

    return res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await db("admin_users").where({ id }).first();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await db("admin_users").where({ id }).del();

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};