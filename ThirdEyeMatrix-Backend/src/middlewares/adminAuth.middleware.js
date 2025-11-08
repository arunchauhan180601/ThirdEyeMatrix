
const jwt = require("jsonwebtoken");
const { db } = require("../config/db"); // Import the knex instance

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

async function authMiddleware(req, res, next) {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ message: "Unauthenticated: Token required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    let user;
    if (decoded.roleName === "super_admin") {
      user = await db("admins").where({ id: decoded.id }).first();
    } else {
      user = await db("admin_users").where({ id: decoded.id }).first();
    }

    if (!user) return res.status(401).json({ message: "User not found" });

    const role = await db("roles").where({ id: user.role_id }).first(); // Assuming role_id is stored in admin/admin_user table
    const permissions = await db("role_permissions")
      .join("permissions", "role_permissions.permission_id", "=", "permissions.id")
      .where("role_id", role.id)
      .select("permissions.name");

    req.user = {
      ...user,
      role: role.name,
      permissions: permissions.map((p) => p.name),
    };

    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
}

function hasPermission(permission) {
  return (req, res, next) => {
    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({ message: "User is authenticated but not a authorized" });
    }
    next();
  };




  
}

module.exports = { authMiddleware, hasPermission };
