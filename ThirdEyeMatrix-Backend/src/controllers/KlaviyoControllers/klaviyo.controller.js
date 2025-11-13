const axios = require("axios");
const crypto = require("crypto");
const https = require("https");
const dns = require("dns");
const { db } = require("../../config/db");
require("dotenv").config();

const KLAVIYO_CLIENT_ID = process.env.KLAVIYO_CLIENT_ID;
const KLAVIYO_CLIENT_SECRET = process.env.KLAVIYO_CLIENT_SECRET;
const KLAVIYO_BASE_URL = "https://a.klaviyo.com/api";
const KLAVIYO_OAUTH_URL = "https://www.klaviyo.com/oauth";
const KLAVIYO_TOKEN_URL = "https://a.klaviyo.com/oauth";
const KLAVIYO_REDIRECT_URI = process.env.KLAVIYO_REDIRECT_URI || "https://logier-unsqueezed-teodoro.ngrok-free.dev/api/klaviyo/callback";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";


const oauthStore = new Map();
const OAUTH_TTL_MS = 10 * 60 * 1000; // 10 minutes

function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [state, obj] of oauthStore.entries()) {
    if (now - obj.createdAt > OAUTH_TTL_MS) {
      oauthStore.delete(state);
    }
  }
}
// schedule periodic cleanup
setInterval(cleanupExpiredSessions, 60 * 1000);

// ---------- Helpers ----------
function generatePKCEPair() {
  const codeVerifier = crypto.randomBytes(64).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  return { codeVerifier, codeChallenge };
}

async function makeKlaviyoRequest(
  endpoint,
  method = "GET",
  data = null,
  accessToken = null
) {
  if (!accessToken) throw new Error("Klaviyo access token not available");

  const config = {
    method,
    url: `${KLAVIYO_BASE_URL}${endpoint}`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      revision: "2024-10-15",
    },
  };
  if (data) config.data = data;

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error("Klaviyo API Error:", error.response?.data || error.message);
    throw error;
  }
}

async function ensureValidToken(userId) {
  const store = await db("stores").where({ user_id: userId }).first();
  if (!store || !store.klaviyo_access_token)
    throw new Error("Klaviyo not connected");

  const now = new Date();
  const expiresAt = new Date(store.klaviyo_token_expires_at);
  const buffer = 5 * 60 * 1000;

  if (now.getTime() + buffer >= expiresAt.getTime()) {
    if (!store.klaviyo_refresh_token)
      throw new Error("No refresh token available");

    const tokenResponse = await axios.post(
      `${KLAVIYO_TOKEN_URL}/token`,
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: store.klaviyo_refresh_token,
        client_id: KLAVIYO_CLIENT_ID,
        client_secret: KLAVIYO_CLIENT_SECRET,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    const newExpiresAt = new Date(Date.now() + expires_in * 1000);

    await db("stores")
      .where({ user_id: userId })
      .update({
        klaviyo_access_token: access_token,
        klaviyo_refresh_token: refresh_token || store.klaviyo_refresh_token,
        klaviyo_token_expires_at: newExpiresAt,
      });

    return access_token;
  }

  return store.klaviyo_access_token;
}

// ---------- New: startOAuth (backend generates PKCE + state) ----------
async function startOAuth(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const store = await db("stores").where({ user_id: userId }).first();
    if (!store) return res.status(404).json({ message: "Store not found" });
    if (!KLAVIYO_CLIENT_ID || !KLAVIYO_CLIENT_SECRET) {
      return res
        .status(500)
        .json({ message: "Klaviyo OAuth credentials not configured" });
    }

    const { codeVerifier, codeChallenge } = generatePKCEPair();
    const state = crypto.randomBytes(16).toString("hex");

    // Save mapping server-side (state -> codeVerifier + user/store)
    oauthStore.set(state, {
      codeVerifier,
      userId,
      storeId: store.id,
      createdAt: Date.now(),
    });

    // Build Klaviyo authorize URL
    const params = new URLSearchParams({
      response_type: "code",
      client_id: KLAVIYO_CLIENT_ID,
      redirect_uri: KLAVIYO_REDIRECT_URI,
      scope:
        "accounts:read events:read events:write profiles:read profiles:write lists:read campaigns:read flows:read metrics:read ",
      state,
      code_challenge_method: "S256",
      code_challenge: codeChallenge,
    });

    const authUrl = `${KLAVIYO_OAUTH_URL}/authorize?${params.toString()}`;

    return res.json({ redirectUrl: authUrl });
  } catch (err) {
    console.error("startOAuth error", err);
    return res.status(500).json({ message: "Failed to start Klaviyo OAuth" });
  }
}

async function oauthCallback(req, res) {
  try {
    const { code, state } = req.query;
    console.log("oauthCallback query", { code, state });

    if (!code || !state) {
      return res.status(400).send("Missing code or state");
    }

    const session = oauthStore.get(String(state));
    if (!session) {
      return res.status(400).send("Invalid or expired state");
    } // Remove session immediately to prevent replay attacks

    oauthStore.delete(String(state));

    const { codeVerifier, userId, storeId } = session;
    if (!codeVerifier)
      return res.status(400).send("Missing code verifier on server");

    const authHeaderValue = Buffer.from(
      `${KLAVIYO_CLIENT_ID}:${KLAVIYO_CLIENT_SECRET}`
    ).toString("base64"); // Prepare the payload without client_id and client_secret

    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code: String(code),
      redirect_uri: KLAVIYO_REDIRECT_URI,
      code_verifier: codeVerifier,
    }); // Create a simple agent (no custom lookup)

    const httpsAgent = new https.Agent({ keepAlive: false });

    const tokenResponse = await axios.post(
      `${KLAVIYO_TOKEN_URL}/token`,
      params, // Use the updated params
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json", // Use Basic Authentication for client credentials
          Authorization: `Basic ${authHeaderValue}`,
        },
        httpsAgent,
        family: 4, // prefer IPv4 without custom lookup
        validateStatus: (status) => status >= 200 && status < 500,
      }
    ); // If Cloudflare HTML sneaks through, guard against it:

    if (
      typeof tokenResponse.data === "string" &&
      tokenResponse.data.includes("<html")
    ) {
      throw new Error(
        "Cloudflare blocked the token request; received HTML instead of JSON"
      );
    } // Check for a non-200 status code response that your validateStatus accepted

    if (tokenResponse.status !== 200) {
      console.error(
        "Klaviyo Token Exchange Failed with Status:",
        tokenResponse.status,
        "Data:",
        tokenResponse.data
      ); // Throw an error to be caught below, or handle redirect gracefully
      return res.status(500).send("OAuth token exchange failed.");
    }

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // ✅ Force token validity for 30 days (regardless of Klaviyo's default expiry)
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    const expiresAt = new Date(Date.now() + THIRTY_DAYS_MS);

    await db("stores")
      .where({ user_id: userId, id: storeId })
      .update({
        klaviyo_access_token: access_token,
        klaviyo_refresh_token: refresh_token || null,
        klaviyo_token_expires_at: expiresAt,
        klaviyo_connected_at: new Date(),
      });

    // Redirect after successful save
    return res.redirect(`${FRONTEND_URL}/welcome/integrations/klaviyo/summary`);
  } catch (err) {
    console.error("Klaviyo OAuth callback error:", err?.response?.data || err);
    return res.status(500).send("OAuth callback failed");
  }
}

// ---------- rest of your methods unchanged (getAccountInfo, getLists, ...) ----------

async function getAccountInfo(req, res) {
  try {
    const userId = req.user.id;
    const accessToken = await ensureValidToken(userId);
    const accountInfo = await makeKlaviyoRequest(
      "/accounts/",
      "GET",
      null,
      accessToken
    );
    return res.json(accountInfo);
  } catch (err) {
    console.error("Klaviyo getAccountInfo error", err);
    return res
      .status(500)
      .json({ message: "Failed to get Klaviyo account info" });
  }
}

async function getLists(req, res) {
  try {
    const userId = req.user.id;
    const accessToken = await ensureValidToken(userId);
    const lists = await makeKlaviyoRequest("/lists/", "GET", null, accessToken);

    return res.json(lists);
  } catch (err) {
    console.error("Klaviyo getLists error", err);
    return res.status(500).json({ message: "Failed to get Klaviyo lists" });
  }
}

async function getProfiles(req, res) {
  try {
    const userId = req.user.id;
    const accessToken = await ensureValidToken(userId);
    const profiles = await makeKlaviyoRequest(
      "/profiles/",
      "GET",
      null,
      accessToken
    );

    return res.json(profiles);
  } catch (err) {
    console.error("Klaviyo getProfiles error", err);
    return res.status(500).json({ message: "Failed to get Klaviyo profiles" });
  }
}

async function getCampaigns(req, res) {
  try {
    const userId = req.user.id;
    const accessToken = await ensureValidToken(userId);
    const filter = "equals(messages.channel,'email')";
    const campaigns = await makeKlaviyoRequest(
      `/campaigns/?filter=${encodeURIComponent(filter)}`,
      "GET",
      null,
      accessToken
    );
    return res.json(campaigns);
  } catch (err) {
    console.error("Klaviyo getCampaigns error", err);
    return res.status(500).json({ message: "Failed to get Klaviyo campaigns" });
  }
}

async function getFlows(req, res) {
  try {
    const userId = req.user.id;
    const accessToken = await ensureValidToken(userId);
    const flows = await makeKlaviyoRequest("/flows/", "GET", null, accessToken);

    return res.json(flows);
  } catch (err) {
    console.error("Klaviyo getFlows error", err);
    return res.status(500).json({ message: "Failed to get Klaviyo flows" });
  }
}

async function getMetrics(req, res) {
  try {
    const userId = req.user.id;
    const accessToken = await ensureValidToken(userId);
    const { startDate, endDate, campaignId } = req.query;
    let endpoint = "/metrics/";

    if (campaignId) {
      endpoint = `/campaigns/${campaignId}/relationships/metrics/`;
    }

    const metrics = await makeKlaviyoRequest(
      endpoint,
      "GET",
      null,
      accessToken
    );

    return res.json(metrics);
  } catch (err) {
    console.error("Klaviyo getMetrics error", err);
    return res.status(500).json({ message: "Failed to get Klaviyo metrics" });
  }
}

async function getEvents(req, res) {
  try {
    const userId = req.user.id;
    const accessToken = await ensureValidToken(userId);
    const { page = 1, limit = 100, profileId } = req.query;
    let endpoint = "/events/";

    if (profileId) {
      endpoint = `/profiles/${profileId}/events/`;
    }

    const events = await makeKlaviyoRequest(endpoint, "GET", null, accessToken);

    return res.json(events);
  } catch (err) {
    console.error("Klaviyo getEvents error", err);
    return res.status(500).json({ message: "Failed to get Klaviyo events" });
  }
}

async function disconnect(req, res) {
  try {
    const userId = req.user.id;

    await db("stores").where({ user_id: userId }).update({
      klaviyo_access_token: null,
      klaviyo_refresh_token: null,
      klaviyo_token_expires_at: null,
      klaviyo_connected_at: null,
    });

    return res.json({ message: "Klaviyo disconnected successfully" });
  } catch (err) {
    console.error("Klaviyo disconnect error", err);
    return res.status(500).json({ message: "Failed to disconnect Klaviyo" });
  }
}

async function status(req, res) {
  try {
    const userId = req.user.id;
    const store = await db("stores").where({ user_id: userId }).first();
    if (!store) return res.status(404).json({ message: "Store not found" });

    const hasToken = !!store.klaviyo_access_token;
    let isValid = false;
    if (hasToken) {
      var expiresAt = store.klaviyo_token_expires_at
        ? new Date(store.klaviyo_token_expires_at)
        : null;
      isValid = !expiresAt || expiresAt.getTime() > Date.now();
    }
    return res.json({ connected: hasToken && isValid });
  } catch (err) {
    console.error("Klaviyo status error", err);
    return res.status(500).json({ message: "Failed to get Klaviyo status" });
  }
}

async function testOAuthConfig(req, res) {
  try {
    const config = {
      clientId: KLAVIYO_CLIENT_ID ? "Configured" : "Missing",
      clientSecret: KLAVIYO_CLIENT_SECRET ? "Configured" : "Missing",
      redirectUri: KLAVIYO_REDIRECT_URI,
      oauthUrl: KLAVIYO_OAUTH_URL,
    };

    return res.json({
      message: "OAuth configuration status",
      config,
    });
  } catch (err) {
    console.error("Test OAuth config error", err);
    return res.status(500).json({ message: "Failed to test OAuth config" });
  }
}

module.exports = {
  startOAuth,
  oauthCallback,
  getAccountInfo,
  getLists,
  getProfiles,
  getCampaigns,
  getFlows,
  getMetrics,
  getEvents,
  disconnect,
  status,
  testOAuthConfig,
};
