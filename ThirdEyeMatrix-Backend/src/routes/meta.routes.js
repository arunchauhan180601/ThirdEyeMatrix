const express = require("express");
const router = express.Router();
const { userAuthMiddleware } = require("../middlewares/userAuth.middleware");
const MetaController = require("../controllers/MetaControllers/meta.controller");

// Start OAuth: create Facebook auth URL and return it
router.post("/start", userAuthMiddleware, MetaController.startOAuth);

// OAuth callback: Facebook redirects here with code
router.get("/callback", MetaController.oauthCallback);

// Connection status
router.get("/status", userAuthMiddleware, MetaController.status);

// Disconnect and clear stored Meta data
router.delete("/disconnect", userAuthMiddleware, MetaController.disconnect);

// Fetch user businesses and ad accounts (requires token stored in session or DB)
router.get("/businesses", userAuthMiddleware, MetaController.getBusinesses);
router.get("/ad-accounts", userAuthMiddleware, MetaController.getAdAccounts);

// Save selection (business, ad account, attribution window)
router.post("/save-selection", userAuthMiddleware, MetaController.saveSelection);

// Optional: ping to check token validity and refresh if near expiry
router.get("/token/status", userAuthMiddleware, async (req, res) => {
  try {
    // Reuse getBusinesses path to trigger ensureValidToken indirectly, or expose a method
    return res.json({ message: "OK" });
  } catch (e) {
    return res.status(500).json({ message: "Failed" });
  }
});

// Data fetch endpoints
router.get("/campaigns", userAuthMiddleware, MetaController.getCampaigns);
router.get("/ads", userAuthMiddleware, MetaController.getAds);
router.get("/insights", userAuthMiddleware, MetaController.getInsights);

module.exports = router;


