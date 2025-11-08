const express = require("express");
const router = express.Router();

const { connectShopify, shopifyCallback, getProducts, getCustomers, getOrders } = require("../controllers/ShopifyControllers/shopify.controller");
const userAuthMiddleware = require("../middlewares/userAuth.middleware").userAuthMiddleware;

// Shopify OAuth flow
router.post("/connect", userAuthMiddleware, connectShopify);
router.get("/callback", shopifyCallback);

// Protected routes
router.get("/products", userAuthMiddleware, getProducts);
router.get("/customers", userAuthMiddleware, getCustomers);
router.get("/orders", userAuthMiddleware, getOrders);

module.exports = router;
