const axios = require("axios");
const qs = require("querystring");
const { db } = require("../../config/db");
require('dotenv').config();


const FB_API_VERSION = process.env.FB_API_VERSION || "v21.0";
const FB_APP_ID = process.env.FB_APP_ID;
const FB_APP_SECRET = process.env.FB_APP_SECRET;
const FB_REDIRECT_URI = process.env.FB_REDIRECT_URI || "http://localhost:5000/api/meta/callback";

function buildFacebookAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: FB_APP_ID,
    redirect_uri: FB_REDIRECT_URI,
    state,
    response_type: "code",
    scope: [
      // permissions needed for ads insights and account listing
      "ads_read",
      "ads_management",
      "business_management",
    ].join(","),
  });
  return `https://www.facebook.com/${FB_API_VERSION}/dialog/oauth?${params.toString()}`;
}

async function exchangeCodeForToken(code) {
  const params = new URLSearchParams({
    client_id: FB_APP_ID,
    client_secret: FB_APP_SECRET,
    redirect_uri: FB_REDIRECT_URI,
    code,
  });
  const url = `https://graph.facebook.com/${FB_API_VERSION}/oauth/access_token?${params.toString()}`;
  const { data } = await axios.get(url);
  return data; // { access_token, token_type, expires_in }
}

async function exchangeForLongLivedToken(shortLivedToken) {
  // https://developers.facebook.com/docs/facebook-login/access-tokens/refreshing/
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: FB_APP_ID,
    client_secret: FB_APP_SECRET,
    fb_exchange_token: shortLivedToken,
  });
  const url = `https://graph.facebook.com/${FB_API_VERSION}/oauth/access_token?${params.toString()}`;
  const { data } = await axios.get(url);
  return data; // { access_token, token_type, expires_in }
}

async function fetchMe(accessToken) {
  const { data } = await axios.get(`https://graph.facebook.com/${FB_API_VERSION}/me`, {
    params: { access_token: accessToken },
  });
  return data;
}

async function fetchBusinesses(accessToken) {
  const { data } = await axios.get(`https://graph.facebook.com/${FB_API_VERSION}/me/businesses`, {
    params: { access_token: accessToken, fields: "id,name" },
  });
  return data.data || [];
}

async function fetchAdAccounts(accessToken, businessId) {
  // For business: use owned_ad_accounts (or client_ad_accounts if you are an agency)
  // For user: use /me/adaccounts
  const endpoint = businessId
    ? `https://graph.facebook.com/${FB_API_VERSION}/${businessId}/owned_ad_accounts`
    : `https://graph.facebook.com/${FB_API_VERSION}/me/adaccounts`;
  const { data } = await axios.get(endpoint, {
    params: { access_token: accessToken, fields: "id,account_id,name,account_status" },
  });
  return data.data || [];
}

module.exports = {
  async startOAuth(req, res) {
    try {
      const userId = req.user.id;
      const store = await db("stores").where({ user_id: userId }).first();
      if (!store) return res.status(404).json({ message: "Store not found" });

      const state = Buffer.from(JSON.stringify({ userId, storeId: store.id })).toString("base64");
      const url = buildFacebookAuthUrl(state);
      return res.json({ redirectUrl: url });
    } catch (err) {
      console.error("Meta startOAuth error", err);
      return res.status(500).json({ message: "Failed to start Meta OAuth" });
    }
  },

  async status(req, res) {
    try {
      const userId = req.user.id;
      const store = await db("stores").where({ user_id: userId }).first();
      if (!store) return res.status(404).json({ message: "Store not found" });

      const hasToken = !!store.meta_access_token;
      let isValid = false;
      if (hasToken) {
        const expiresAt = store.meta_token_expires_at ? new Date(store.meta_token_expires_at) : null;
        isValid = !expiresAt || expiresAt.getTime() > Date.now();
      }
      return res.json({ connected: hasToken && isValid });
    } catch (err) {
      console.error("Meta status error", err);
      return res.status(500).json({ message: "Failed to get Meta status" });
    }
  },

  async oauthCallback(req, res) {
    try {
      const { code, state } = req.query;
      if (!code) return res.status(400).send("Missing code");
      const decoded = state ? JSON.parse(Buffer.from(String(state), "base64").toString()) : null;
      const tokenData = await exchangeCodeForToken(code);
      // Immediately exchange for a long-lived token
      const longLived = await exchangeForLongLivedToken(tokenData.access_token);

      const accessToken = longLived.access_token || tokenData.access_token;
      const expiresIn = longLived.expires_in || tokenData.expires_in;
      const expiresAt = new Date(Date.now() + (expiresIn || 0) * 1000);

      if (decoded && decoded.userId && decoded.storeId) {
        await db("stores").where({ id: decoded.storeId, user_id: decoded.userId }).update({
          meta_access_token: accessToken,
          meta_token_expires_at: expiresAt,
        });
      }

      // Redirect back to frontend selection page
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      return res.redirect(`${frontendUrl}/welcome/integrations/meta/select`);
    } catch (err) {
      console.error("Meta oauthCallback error", err?.response?.data || err);
      return res.status(500).send("OAuth callback failed");
    }
  },

  async getBusinesses(req, res) {
    try {
      const userId = req.user.id;
      const store = await ensureValidToken(userId);
      if (!store || !store.meta_access_token) {
        return res.status(400).json({ message: "Meta not connected" });
      }
      const businesses = await fetchBusinesses(store.meta_access_token);
      return res.json({ businesses });
    } catch (err) {
      console.error("Meta getBusinesses error", err?.response?.data || err);
      return res.status(500).json({ message: "Failed to fetch businesses" });
    }
  },

  async getAdAccounts(req, res) {
    try {
      const userId = req.user.id;
      const { businessId } = req.query;
      const store = await ensureValidToken(userId);
      if (!store || !store.meta_access_token) {
        return res.status(400).json({ message: "Meta not connected" });
      }
      const adAccounts = await fetchAdAccounts(store.meta_access_token, businessId);
      return res.json({ adAccounts });
    } catch (err) {
      console.error("Meta getAdAccounts error", err?.response?.data || err);
      return res.status(500).json({ message: "Failed to fetch ad accounts" });
    }
  },

  async saveSelection(req, res) {
    try {
      const userId = req.user.id;
      const { businessId, businessName, adAccountId, adAccountName, attributionWindow } = req.body;
      const store = await db("stores").where({ user_id: userId }).first();
      if (!store) return res.status(404).json({ message: "Store not found" });

      await db("stores").where({ id: store.id }).update({
        meta_business_id: businessId,
        meta_business_name: businessName,
        meta_ad_account_id: adAccountId,
        meta_ad_account_name: adAccountName,
        meta_attribution_window: attributionWindow,
      });

      return res.json({
        message: "Meta selection saved",
        connection: {
          metaAttributionWindow: attributionWindow,
          id: adAccountId,
          name: adAccountName,
          status: "Refreshing Data...",
        },
      });
    } catch (err) {
      console.error("Meta saveSelection error", err);
      return res.status(500).json({ message: "Failed to save selection" });
    }
  },

  async getCampaigns(req, res) {
    try {
      const userId = req.user.id;
      const store = await ensureValidToken(userId);
      if (!store?.meta_access_token || !store?.meta_ad_account_id) {
        return res.status(400).json({ message: "Meta ad account not selected" });
      }
      const accountId = store.meta_ad_account_id.startsWith('act_') ? store.meta_ad_account_id : `act_${store.meta_ad_account_id}`;
      const { data } = await axios.get(`https://graph.facebook.com/${FB_API_VERSION}/${accountId}/campaigns`, {
        params: {
          access_token: store.meta_access_token,
          fields: "id,name,status,objective,effective_status,created_time,updated_time",
          limit: 100,
        },
      });
      return res.json({ campaigns: data.data || [] });
    } catch (err) {
      console.error("Meta getCampaigns error", err?.response?.data || err);
      return res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  },

  async getAds(req, res) {
    try {
      const userId = req.user.id;
      const store = await ensureValidToken(userId);
      if (!store?.meta_access_token || !store?.meta_ad_account_id) {
        return res.status(400).json({ message: "Meta ad account not selected" });
      }
      const accountId = store.meta_ad_account_id.startsWith('act_') ? store.meta_ad_account_id : `act_${store.meta_ad_account_id}`;
      const { data } = await axios.get(`https://graph.facebook.com/${FB_API_VERSION}/${accountId}/ads`, {
        params: {
          access_token: store.meta_access_token,
          fields: "id,name,status,adset_id,campaign_id,creative{effective_object_story_id},effective_status",
          limit: 100,
        },
      });
    
      return res.json({ ads: data.data || [] });
    } catch (err) {
      console.error("Meta getAds error", err?.response?.data || err);
      return res.status(500).json({ message: "Failed to fetch ads" });
    }
  },

  async getInsights(req, res) {
    try {
      const userId = req.user.id;
      const store = await ensureValidToken(userId);
      if (!store?.meta_access_token || !store?.meta_ad_account_id) {
        return res.status(400).json({ message: "Meta ad account not selected" });
      }
      const accountId = store.meta_ad_account_id.startsWith('act_') ? store.meta_ad_account_id : `act_${store.meta_ad_account_id}`;

      const {
        date_preset = 'last_30d',
        level = 'campaign',
        time_increment = 1,
        since,
        until
      } = req.query;

      const fields = [
        'date_start','date_stop','campaign_id','adset_id','ad_id','impressions','clicks','spend','reach','frequency','campaign_name','ad_name',
        'actions','action_values'
      ].join(',');

      const apiParams = {
        access_token: store.meta_access_token,
        level,
        time_increment,
        fields,
      };

      if (since && until) {
        // Use custom date range
        apiParams.time_range = JSON.stringify({ since, until });
      } else {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1); 

        const thirtyDaysAgo = new Date(yesterday);
        thirtyDaysAgo.setDate(yesterday.getDate() - 29); 
        
        const sinceDate = thirtyDaysAgo.toISOString().split('T')[0];
        const untilDate = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        apiParams.time_range = JSON.stringify({ since: sinceDate, until: untilDate });
      }

      const { data } = await axios.get(`https://graph.facebook.com/${FB_API_VERSION}/${accountId}/insights`, {
        params: apiParams,
      });

      return res.json({ insights: data.data || [] });
    } catch (err) {
      console.error("Meta getInsights error", err?.response?.data || err);
      return res.status(500).json({ message: "Failed to fetch insights" });
    }
  },

  async disconnect(req, res) {
    try {
      const userId = req.user.id;
      const store = await db("stores").where({ user_id: userId }).first();
      if (!store) return res.status(404).json({ message: "Store not found" });

      await db("stores").where({ id: store.id }).update({
        meta_access_token: null,
        meta_token_expires_at: null,
        meta_business_id: null,
        meta_business_name: null,
        meta_ad_account_id: null,
        meta_ad_account_name: null,
        meta_attribution_window: null,
      });

      return res.json({ message: "Meta disconnected" });
    } catch (err) {
      console.error("Meta disconnect error", err);
      return res.status(500).json({ message: "Failed to disconnect Meta" });
    }
  },
};

async function ensureValidToken(userId) {
  const store = await db("stores").where({ user_id: userId }).first();
  if (!store || !store.meta_access_token) return store;
  const expiresAt = store.meta_token_expires_at ? new Date(store.meta_token_expires_at) : null;
  const now = new Date();
  // If expiring within 5 days, try to refresh to a new long-lived token
  if (expiresAt && (expiresAt.getTime() - now.getTime()) < 5 * 24 * 60 * 60 * 1000) {
    try {
      const refreshed = await exchangeForLongLivedToken(store.meta_access_token);
      if (refreshed?.access_token) {
        const newExpiresAt = new Date(Date.now() + (refreshed.expires_in || 0) * 1000);
        await db("stores").where({ id: store.id }).update({
          meta_access_token: refreshed.access_token,
          meta_token_expires_at: newExpiresAt,
        });
        return await db("stores").where({ id: store.id }).first();
      }
    } catch (e) {
      // fall through; we'll use current token if refresh fails
      console.error("Meta token refresh failed", e?.response?.data || e);
    }
  }
  return store;
}



