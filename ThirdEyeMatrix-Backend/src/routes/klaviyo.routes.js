const express = require("express");
const router = express.Router();
const { userAuthMiddleware } = require("../middlewares/userAuth.middleware");
const KlaviyoController = require("../controllers/KlaviyoControllers/klaviyo.controller");

// Test OAuth configuration
router.get("/test-config", KlaviyoController.testOAuthConfig);

// Start Klaviyo OAuth flow
router.post("/start", userAuthMiddleware, KlaviyoController.startOAuth);

// OAuth callback: Klaviyo redirects here with code
router.get("/callback", KlaviyoController.oauthCallback);

// Get Klaviyo account information
router.get("/account", userAuthMiddleware, KlaviyoController.getAccountInfo);

// Get Klaviyo lists
router.get("/lists", userAuthMiddleware, KlaviyoController.getLists);

// Get Klaviyo profiles (customers)
router.get("/profiles", userAuthMiddleware, KlaviyoController.getProfiles);

// Get Klaviyo campaigns
router.get("/campaigns", userAuthMiddleware, KlaviyoController.getCampaigns);

// Get Klaviyo flows
router.get("/flows", userAuthMiddleware, KlaviyoController.getFlows);

// Get Klaviyo metrics
router.get("/metrics", userAuthMiddleware, KlaviyoController.getMetrics);

// Get Klaviyo events
router.get("/events", userAuthMiddleware, KlaviyoController.getEvents);

// Disconnect Klaviyo
router.delete("/disconnect", userAuthMiddleware, KlaviyoController.disconnect);

// Connection status
router.get("/status", userAuthMiddleware, KlaviyoController.status);

module.exports = router;
