const express = require("express");
const router = express.Router();
const { userAuthMiddleware } = require("../middlewares/userAuth.middleware");
const GoogleAdsController = require("../controllers/GoogleAdsControllers/googleads.controller");

// Start OAuth: create Google auth URL and return it
router.post("/start", userAuthMiddleware, GoogleAdsController.startOAuth);

// OAuth callback: Google redirects here with code
router.get("/callback", GoogleAdsController.oauthCallback);

// Fetch customer accounts
router.get("/customer-accounts", userAuthMiddleware, GoogleAdsController.getCustomerAccounts);

// Save selection (customer account)
router.post("/save-selection", userAuthMiddleware, GoogleAdsController.saveSelection);

// Data fetch endpoints
router.get("/campaigns", userAuthMiddleware, GoogleAdsController.getCampaigns);
router.get("/ads", userAuthMiddleware, GoogleAdsController.getAds);
router.get("/insights", userAuthMiddleware, GoogleAdsController.getInsights);

module.exports = router;
