
const express = require("express");
const router = express.Router();
const {
  getProducts,
  getCustomers,
  getAllOrders,
} = require("../controllers/MagentoControllers/magento.controller");
const { userAuthMiddleware } = require("../middlewares/userAuth.middleware");

// Example routes
router.get("/products", userAuthMiddleware, getProducts);
router.get("/customers", userAuthMiddleware, getCustomers);
router.get("/orders", userAuthMiddleware, getAllOrders);

module.exports = router;


