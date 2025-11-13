<!-- TO EDIT AND ADD REDIRECT URI -->

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. We will see ThirdEyeMatrix-Google-Ads-Test
3. select credentials in sidebar 
4. under OAuth 2.0 Client IDs click on Third Eye Matrix Web
5. add redirect_url  SERVER_GOOGLE_ADS_REDIRECT_URI="https://logier-unsqueezed-teodoro.ngrok-free.dev/api/google-ads/callback"   we can not add 192.168.1.122:5000 because it   is private . so i have keep line ngrok server . 
6. save
7. direct - https://console.cloud.google.com/auth/clients/194833788833-ji1o6ebc27gopa9rr97l9mqlme1tuk8n.apps.googleusercontent.com?project=dynamic-cooler-474810-m0


# Google Ads API Integration Setup

## Prerequisites

1. Install the required dependency:
```bash
npm install googleapis
```

2. Add the following environment variables to your `.env` file:
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/google-ads/callback

I have added two REDIRECT_URL = https://logier-unsqueezed-teodoro.ngrok-free.dev/api/google-ads/callback so i need to keep open ngrok server in network server .
```

## Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Ads API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Ads API"
   - Click on it and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URI: `http://localhost:5000/api/google-ads/callback`
   - Download the credentials JSON file
5. Extract the Client ID and Client Secret from the downloaded file
6. Add them to your `.env` file

## Database Migration

Run the migration to add Google Ads columns to your stores table:
```bash
npx knex migrate:latest
```

## API Endpoints

The following endpoints are now available:

- `POST /api/google-ads/start` - Start OAuth flow
- `GET /api/google-ads/callback` - OAuth callback
- `GET /api/google-ads/customer-accounts` - Get accessible customer accounts
- `POST /api/google-ads/save-selection` - Save selected customer account
- `GET /api/google-ads/campaigns` - Get campaigns
- `GET /api/google-ads/ads` - Get ads
- `GET /api/google-ads/insights` - Get insights with date range

## Frontend Pages

The following pages have been created:
- `/welcome/integrations/google-ads/select` - Customer account selection
- `/welcome/integrations/google-ads/summary` - Connection summary

## Usage Flow

1. User clicks "Connect" on Google Ads in the integrations page
2. User is redirected to Google OAuth consent page
3. After consent, user is redirected to customer account selection page
4. User selects a customer account
5. User is redirected to summary page showing connection status
6. Data is automatically synced in the background

## Data Structure

The Google Ads integration fetches:
- **Campaigns**: Campaign ID, name, status
- **Ads**: Ad group ID, name, status, campaign ID
- **Insights**: Campaign performance data including impressions, clicks, cost, conversions, CTR, CPC

## Token Management

- Access tokens are automatically refreshed when they expire
- Refresh tokens are stored securely in the database
- Token validation happens on each API call
