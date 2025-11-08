const express = require("express");
const { authMiddleware, hasPermission  } = require("../middlewares/adminAuth.middleware");
const { getRoles, createUser , getAllUsers, editUser, deleteUser } = require("../controllers/AdminControllers/adminUser.controller");
const router = express.Router();

router.get("/role" , authMiddleware, getRoles);
router.get("/all", authMiddleware ,  getAllUsers);
router.post("/create" , authMiddleware, hasPermission("create_users"), createUser);
router.put("/edit/:id", authMiddleware, hasPermission("edit_users"), editUser);
router.delete("/delete/:id", authMiddleware, hasPermission("delete_users"), deleteUser);

module.exports = router;