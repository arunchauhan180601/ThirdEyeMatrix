const axios = require('axios');
const { google } = require('googleapis');
const { db } = require("../../config/db");
require('dotenv').config();

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_ADS_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_ADS_REDIRECT_URI || 'http://localhost:5000/api/google-ads/callback';
const GOOGLE_ADS_API_VERSION = 'v16';

// OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

function buildGoogleAuthUrl(state) {
  const scopes = [
    'https://www.googleapis.com/auth/adwords',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ];
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state: state,
    prompt: 'consent' // Force consent to get refresh token
  });
}

async function exchangeCodeForToken(code) {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    throw error;
  }
}

async function refreshAccessToken(refreshToken) {
  try {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw error;
  }
}

async function getGoogleAdsService(accessToken) {
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.ads({ version: GOOGLE_ADS_API_VERSION, auth: oauth2Client });
}

async function fetchCustomerAccounts(accessToken) {
  try {
    const adsService = await getGoogleAdsService(accessToken);
    const response = await adsService.customers.listAccessibleCustomers();
    return response.data.resourceNames || [];
  } catch (error) {
    console.error('Error fetching customer accounts:', error);
    throw error;
  }
}

async function fetchCustomerDetails(accessToken, customerId) {
  try {
    const adsService = await getGoogleAdsService(accessToken);
    const response = await adsService.customers.get({
      resourceName: `customers/${customerId}`
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching customer details:', error);
    throw error;
  }
}

module.exports = {
  async startOAuth(req, res) {
    try {
      const userId = req.user.id;
      const store = await db("stores").where({ user_id: userId }).first();
      if (!store) return res.status(404).json({ message: "Store not found" });

      const state = Buffer.from(JSON.stringify({ userId, storeId: store.id })).toString("base64");
      const url = buildGoogleAuthUrl(state);
      return res.json({ redirectUrl: url });
    } catch (err) {
      console.error("Google Ads startOAuth error", err);
      return res.status(500).json({ message: "Failed to start Google OAuth" });
    }
  },

  async oauthCallback(req, res) {
    try {
      const { code, state } = req.query;
      if (!code) return res.status(400).send("Missing code");
      
      const decoded = state ? JSON.parse(Buffer.from(String(state), "base64").toString()) : null;
      const tokens = await exchangeCodeForToken(code);

      if (decoded && decoded.userId && decoded.storeId) {
        await db("stores").where({ id: decoded.storeId, user_id: decoded.userId }).update({
          google_access_token: tokens.access_token,
          google_refresh_token: tokens.refresh_token,
          google_token_expires_at: new Date(tokens.expiry_date || Date.now() + 3600000),
        });
      }

      // Redirect back to frontend selection page
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      return res.redirect(`${frontendUrl}/welcome/integrations/google-ads/select`);
    } catch (err) {
      console.error("Google Ads oauthCallback error", err);
      return res.status(500).send("OAuth callback failed");
    }
  },

  async getCustomerAccounts(req, res) {
    try {
      const userId = req.user.id;
      const store = await ensureValidToken(userId);
      if (!store?.google_access_token) {
        return res.status(400).json({ message: "Google Ads not connected" });
      }

      const customerResourceNames = await fetchCustomerAccounts(store.google_access_token);
      const customers = [];

      for (const resourceName of customerResourceNames) {
        const customerId = resourceName.split('/')[1];
        try {
          const customerDetails = await fetchCustomerDetails(store.google_access_token, customerId);
          customers.push({
            id: customerId,
            name: customerDetails.descriptiveName || `Customer ${customerId}`,
            resourceName: resourceName
          });
        } catch (error) {
          console.error(`Error fetching details for customer ${customerId}:`, error);
        }
      }

      return res.json({ customers });
    } catch (err) {
      console.error("Google Ads getCustomerAccounts error", err);
      return res.status(500).json({ message: "Failed to fetch customer accounts" });
    }
  },

  async saveSelection(req, res) {
    try {
      const userId = req.user.id;
      const { customerId, customerName } = req.body;
      const store = await db("stores").where({ user_id: userId }).first();
      if (!store) return res.status(404).json({ message: "Store not found" });

      await db("stores").where({ id: store.id }).update({
        google_customer_id: customerId,
        google_customer_name: customerName,
      });

      return res.json({
        message: "Google Ads selection saved",
        connection: {
          id: customerId,
          name: customerName,
          status: "Refreshing Data...",
        },
      });
    } catch (err) {
      console.error("Google Ads saveSelection error", err);
      return res.status(500).json({ message: "Failed to save selection" });
    }
  },

  async getCampaigns(req, res) {
    try {
      const userId = req.user.id;
      const store = await ensureValidToken(userId);
      if (!store?.google_access_token || !store?.google_customer_id) {
        return res.status(400).json({ message: "Google Ads customer not selected" });
      }

      const adsService = await getGoogleAdsService(store.google_access_token);
      const response = await adsService.campaigns.list({
        customerId: store.google_customer_id,
        pageSize: 100,
      });

      const campaigns = response.data.results?.map(campaign => ({
        id: campaign.resourceName.split('/')[3],
        name: campaign.name,
        status: campaign.status,
        resourceName: campaign.resourceName
      })) || [];

      return res.json({ campaigns });
    } catch (err) {
      console.error("Google Ads getCampaigns error", err?.response?.data || err);
      return res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  },

  async getAds(req, res) {
    try {
      const userId = req.user.id;
      const store = await ensureValidToken(userId);
      if (!store?.google_access_token || !store?.google_customer_id) {
        return res.status(400).json({ message: "Google Ads customer not selected" });
      }

      const adsService = await getGoogleAdsService(store.google_access_token);
      const response = await adsService.adGroups.list({
        customerId: store.google_customer_id,
        pageSize: 100,
      });

      const ads = response.data.results?.map(adGroup => ({
        id: adGroup.resourceName.split('/')[3],
        name: adGroup.name,
        status: adGroup.status,
        campaignId: adGroup.campaign?.split('/')[3],
        resourceName: adGroup.resourceName
      })) || [];

      return res.json({ ads });
    } catch (err) {
      console.error("Google Ads getAds error", err?.response?.data || err);
      return res.status(500).json({ message: "Failed to fetch ads" });
    }
  },

  async getInsights(req, res) {
    try {
      const userId = req.user.id;
      const store = await ensureValidToken(userId);
      if (!store?.google_access_token || !store?.google_customer_id) {
        return res.status(400).json({ message: "Google Ads customer not selected" });
      }

      const { 
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate = new Date().toISOString().split('T')[0],
        level = 'CAMPAIGN'
      } = req.query;

      const adsService = await getGoogleAdsService(store.google_access_token);
      const response = await adsService.reports.search({
        customerId: store.google_customer_id,
        query: `
          SELECT 
            campaign.id,
            campaign.name,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions,
            metrics.conversions_value,
            segments.date
          FROM campaign 
          WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
          ORDER BY segments.date DESC
        `
      });

      const insights = response.data.results?.map(result => ({
        campaign_id: result.campaign?.id,
        campaign_name: result.campaign?.name,
        date: result.segments?.date,
        impressions: result.metrics?.impressions || 0,
        clicks: result.metrics?.clicks || 0,
        cost_micros: result.metrics?.costMicros || 0,
        conversions: result.metrics?.conversions || 0,
        conversions_value: result.metrics?.conversionsValue || 0,
        ctr: result.metrics?.clicks && result.metrics?.impressions ? 
          (result.metrics.clicks / result.metrics.impressions * 100).toFixed(2) : 0,
        cpc: result.metrics?.clicks && result.metrics?.costMicros ? 
          (result.metrics.costMicros / 1000000 / result.metrics.clicks).toFixed(2) : 0
      })) || [];

      return res.json({ insights });
    } catch (err) {
      console.error("Google Ads getInsights error", err?.response?.data || err);
      return res.status(500).json({ message: "Failed to fetch insights" });
    }
  }
};

async function ensureValidToken(userId) {
  const store = await db("stores").where({ user_id: userId }).first();
  if (!store || !store.google_access_token) return store;
  
  const expiresAt = store.google_token_expires_at ? new Date(store.google_token_expires_at) : null;
  const now = new Date();
  
  // If expiring within 1 hour, try to refresh
  if (expiresAt && (expiresAt.getTime() - now.getTime()) < 60 * 60 * 1000) {
    try {
      if (store.google_refresh_token) {
        const refreshed = await refreshAccessToken(store.google_refresh_token);
        if (refreshed?.access_token) {
          const newExpiresAt = new Date(refreshed.expiry_date || Date.now() + 3600000);
          await db("stores").where({ id: store.id }).update({
            google_access_token: refreshed.access_token,
            google_token_expires_at: newExpiresAt,
          });
          return await db("stores").where({ id: store.id }).first();
        }
      }
    } catch (e) {
      console.error("Google Ads token refresh failed", e);
    }
  }
  return store;
}
