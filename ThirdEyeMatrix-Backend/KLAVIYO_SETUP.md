<!-- How To Edit Klaviyo Redirect URI-->
Klaviyo login : dhameliya26@gmail.com
 
Klaviyo Password : Magesture123.

klaviyo redirect and key url : https://www.klaviyo.com/manage-apps




# Klaviyo OAuth Integration Setup Guide

## Overview
This guide will help you set up Klaviyo OAuth integration for your ThirdEyeMatrix application, similar to the existing Meta Ads and Google Ads integrations. This allows multiple users to connect their own Klaviyo accounts securely.

## Prerequisites
- Klaviyo account with admin access
- Ability to create OAuth applications in Klaviyo

## Step 1: Create a Klaviyo OAuth App

Klaviyo login : dhameliya26@gmail.com
 
Klaviyo Password : Magesture123.

klaviyo redirect and key url : https://www.klaviyo.com/manage-apps

1. **Log into your Klaviyo account**
2. **Go to Account → Settings → API Keys**
3. **Create a new OAuth App:**
   - Click "Create App" (not API Key)
   - Give it a descriptive name (e.g., "ThirdEyeMatrix Integration")
   - Select the required scopes:
     - `accounts:read` - Read account information
     - `events:read` - Read customer events
     - `events:write` - Write customer events (optional)
     - `profiles:read` - Read customer profiles
     - `profiles:write` - Write customer profiles (optional)
     - `lists:read` - Read email lists
     - `campaigns:read` - Read email campaigns
     - `flows:read` - Read automated flows
     - `metrics:read` - Read campaign metrics
   - Add redirect URI: `https://logier-unsqueezed-teodoro.ngrok-free.dev/api/klaviyo/callback`
   - Click "Create"
4. **Copy the Client ID and Client Secret** (you'll only see the secret once)

## Step 2: Environment Variables Setup

Add these variables to your `.env` file in the backend:

```env
# Klaviyo OAuth Configuration
KLAVIYO_CLIENT_ID=your_klaviyo_client_id_here
KLAVIYO_CLIENT_SECRET=your_klaviyo_client_secret_here
KLAVIYO_REDIRECT_URI=https://logier-unsqueezed-teodoro.ngrok-free.dev/api/klaviyo/callback

# Existing variables (keep these)
BECKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
```

## Step 3: Database Migration

Run the migration to add Klaviyo OAuth support:

```bash
cd ThirsEyeMatrix-Backend
npx knex migrate:latest
```

This will add the `klaviyo_access_token`, `klaviyo_refresh_token`, `klaviyo_token_expires_at`, and `klaviyo_connected_at` columns to the stores table.

## Step 4: API Endpoints

The following endpoints are now available:

### OAuth Authentication
- `POST /api/klaviyo/start` - Initiate Klaviyo OAuth flow
- `GET /api/klaviyo/callback` - Handle OAuth callback

### Data Fetching
- `GET /api/klaviyo/account` - Get account information
- `GET /api/klaviyo/lists` - Get email lists
- `GET /api/klaviyo/profiles` - Get customer profiles
- `GET /api/klaviyo/campaigns` - Get email campaigns
- `GET /api/klaviyo/flows` - Get automated flows
- `GET /api/klaviyo/metrics` - Get campaign metrics
- `GET /api/klaviyo/events` - Get customer events

### Management
- `DELETE /api/klaviyo/disconnect` - Disconnect Klaviyo

## Step 5: Frontend Pages

The following pages have been created:
- `/welcome/integrations/klaviyo/summary` - Connection summary

## Step 6: Usage Flow

1. User clicks "Connect" on Klaviyo in the integrations page
2. User is redirected to Klaviyo's OAuth authorization page
3. User authorizes the application to access their Klaviyo account
4. Klaviyo redirects back to the callback URL with authorization code
5. System exchanges the code for access and refresh tokens
6. User is redirected to the summary page showing account info
7. User can continue to other integrations or disconnect

## Step 7: Data Access

Once connected, you can access:

### Customer Data
- **Profiles**: Customer information, contact details, custom properties
- **Events**: Customer actions, email interactions, website behavior
- **Segments**: Customer groups based on behavior and properties

### Campaign Data
- **Campaigns**: Email campaign details, send times, subject lines
- **Metrics**: Open rates, click rates, bounce rates, unsubscribe rates
- **Flows**: Automated email sequences and their performance

### List Data
- **Lists**: Email list information and subscriber counts
- **Subscribers**: Individual subscriber details and status

## Step 8: OAuth Security Features

- **PKCE (Proof Key for Code Exchange)**: Implements PKCE for enhanced security
- **State Parameter**: Prevents CSRF attacks with encrypted state
- **Token Refresh**: Automatically refreshes expired access tokens
- **Secure Storage**: Tokens are stored securely in the database
- **HTTPS Only**: All OAuth and API requests use HTTPS
- **User Isolation**: Each user's tokens are isolated and secure

## Step 9: API Rate Limits

Klaviyo has rate limits:
- **Free accounts**: 100 requests per minute
- **Paid accounts**: 300 requests per minute

The integration handles rate limiting automatically with proper error handling and token refresh.

## Step 10: Security Notes

- OAuth tokens are stored securely in the database
- All API requests use HTTPS
- Tokens are not logged or exposed in error messages
- Users can disconnect and reconnect at any time
- Automatic token refresh prevents service interruption

## Troubleshooting

### Common Issues

1. **OAuth Authorization Failed**
   - Verify the Client ID and Client Secret are correct
   - Check that the redirect URI matches exactly
   - Ensure the OAuth app has the required scopes
   - Verify the OAuth app is not disabled

2. **Cloudflare Protection Error**
   - This is a common issue when Klaviyo's Cloudflare protection blocks the token exchange
   - The integration now includes multiple retry mechanisms with different headers
   - If the issue persists, try:
     - Using a different IP address or VPN
     - Contacting Klaviyo support to whitelist your server IP
     - Implementing a proxy server for the OAuth requests

3. **Token Refresh Failed**
   - Check if the refresh token has expired
   - Verify the Client Secret is still valid
   - User may need to re-authorize the application

4. **Rate Limit Exceeded**
   - Wait a few minutes before retrying
   - Consider implementing request queuing for high-volume operations

5. **Connection Failed**
   - Check your internet connection
   - Verify Klaviyo's API status
   - Check server logs for detailed error messages

### Testing OAuth Configuration

You can test your OAuth configuration by calling:
```
GET http://localhost:5000/api/klaviyo/test-config
```

This will return the status of your OAuth credentials without making any external requests.

### Support

For additional help:
- Check Klaviyo's API documentation: https://developers.klaviyo.com/
- Review server logs for detailed error messages
- Contact support if issues persist
