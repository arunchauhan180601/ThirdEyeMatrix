const express = require("express");
const router = express.Router();

const { 
  connectWooCommerce, 
  wooCommerceCallback, 
  getProducts, 
  getCustomers, 
  getOrders 
} = require("../controllers/WooCommerceControllers/woocommerce.controller");
const userAuthMiddleware = require("../middlewares/userAuth.middleware").userAuthMiddleware;

// WooCommerce OAuth flow
router.post("/connect", userAuthMiddleware, connectWooCommerce);
router.post("/callback", wooCommerceCallback);

// Protected routes
router.get("/products", userAuthMiddleware, getProducts);
router.get("/customers", userAuthMiddleware, getCustomers);
router.get("/orders", userAuthMiddleware, getOrders);

module.exports = router;
