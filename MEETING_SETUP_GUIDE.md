# Meeting Integration Setup Guide

This guide walks you through getting API keys for Zoom, Google Calendar, and Webex integrations.

---

## 1. Zoom Integration

### What You Get
- View upcoming Zoom meetings
- Import meeting recording transcripts
- Auto-transcribe completed meetings via Sarvam AI

### Step-by-Step Setup

1. **Go to Zoom Marketplace**
   - Visit: https://marketplace.zoom.us
   - Sign in with your Zoom account

2. **Create an OAuth App**
   - Click **Develop** (top-right) > **Build App**
   - Select **General App** > **Create**
   - Give it a name (e.g., "Vaak AI Transcription")

3. **Configure OAuth Settings**
   - In the app settings, go to **OAuth** section
   - Set **Redirect URL**: `http://localhost:3000/meetings?provider=zoom`
   - For production: use your deployed URL instead of localhost

4. **Copy Your Credentials**
   - Copy the **Client ID**
   - Copy the **Client Secret**

5. **Add Required Scopes**
   Go to the **Scopes** tab and add:
   - `meeting:read:list_meetings` — Read meeting list
   - `recording:read:list_recording_files` — Read recordings
   - `recording:read:recording_token` — Access recording files
   - `user:read:user` — Read user profile

6. **Set Up Webhooks (Optional — for real-time events)**
   - Go to **Features** > **Event Subscriptions**
   - Add endpoint URL: `https://your-domain.com/api/meetings/zoom/webhook`
   - Subscribe to events:
     - `meeting.ended` — Triggers auto-transcription after meeting ends
     - `recording.completed` — Notifies when recording is ready

7. **Update Your .env File**
   ```
   ZOOM_CLIENT_ID=your_zoom_client_id_here
   ZOOM_CLIENT_SECRET=your_zoom_client_secret_here
   ZOOM_REDIRECT_URI=http://localhost:3000/meetings?provider=zoom
   ZOOM_WEBHOOK_SECRET=your_webhook_secret_here
   ```

8. **Activate the App**
   - Click **Activation** tab
   - Toggle to activate

### Important Notes
- Free Zoom accounts have limited API access
- Cloud recordings require a Zoom Pro/Business plan
- The OAuth app must be published for others to use (or use development mode for yourself)

---

## 2. Google Calendar + Meet Integration

### What You Get
- View all upcoming meetings from Google Calendar
- Detect Google Meet, Zoom, and Webex links in calendar events
- See meeting attendees and descriptions

### Step-by-Step Setup

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com
   - Sign in with your Google account

2. **Create a Project**
   - Click the project dropdown (top bar) > **New Project**
   - Name it (e.g., "Vaak AI")
   - Click **Create**

3. **Enable Google Calendar API**
   - Go to **APIs & Services** > **Library**
   - Search for "Google Calendar API"
   - Click it > Click **Enable**

4. **Configure OAuth Consent Screen**
   - Go to **APIs & Services** > **OAuth consent screen**
   - Choose **External** (for testing) or **Internal** (for organization)
   - Fill in the required fields:
     - App name: "Vaak AI"
     - User support email: your email
     - Developer contact: your email
   - Click **Save and Continue**
   - Add Scopes:
     - `.../auth/calendar.readonly`
     - `.../auth/calendar.events.readonly`
   - Add test users (your email) if using External type
   - Click **Save and Continue**

5. **Create OAuth Credentials**
   - Go to **APIs & Services** > **Credentials**
   - Click **+ Create Credentials** > **OAuth Client ID**
   - Application type: **Web application**
   - Name: "Vaak AI Web Client"
   - Add **Authorized redirect URI**: `http://localhost:3000/meetings?provider=google`
   - For production: add your deployed URL too
   - Click **Create**

6. **Copy Your Credentials**
   - Copy the **Client ID** (looks like: `xxxx.apps.googleusercontent.com`)
   - Copy the **Client Secret**

7. **Update Your .env File**
   ```
   GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:3000/meetings?provider=google
   ```

### Important Notes
- While in "Testing" mode, only added test users can authorize
- To allow anyone, submit the app for Google verification (takes days/weeks)
- The Calendar API is free with generous quotas (1,000,000 queries/day)
- Google Meet does NOT have a public real-time audio API — we show Meet links from Calendar

---

## 3. Webex Integration

### What You Get
- View upcoming Webex meetings
- Import meeting transcripts from completed meetings
- Access Webex recording transcriptions

### Step-by-Step Setup

1. **Go to Webex Developer Portal**
   - Visit: https://developer.webex.com
   - Sign in with your Webex account (or create one free)

2. **Create an Integration**
   - Click your avatar (top-right) > **My Webex Apps**
   - Click **Create a New App**
   - Choose **Integration**

3. **Configure the Integration**
   - Name: "Vaak AI Transcription"
   - Icon: upload any icon
   - Description: "Meeting transcription integration"
   - **Redirect URI**: `http://localhost:3000/meetings?provider=webex`

4. **Select Scopes**
   Check these scopes:
   - `meeting:schedules_read` — Read meeting schedules
   - `meeting:recordings_read` — Read meeting recordings
   - `meeting:transcripts_read` — Read meeting transcripts

5. **Create and Copy Credentials**
   - Click **Add Integration**
   - Copy the **Client ID**
   - Copy the **Client Secret** (shown only once!)

6. **Update Your .env File**
   ```
   WEBEX_CLIENT_ID=your_webex_client_id
   WEBEX_CLIENT_SECRET=your_webex_client_secret
   WEBEX_REDIRECT_URI=http://localhost:3000/meetings?provider=webex
   ```

### Important Notes
- Webex free accounts have limited transcript access
- Meeting transcripts require Webex Pro or Enterprise plan with transcription enabled
- The integration must be authorized by each user via OAuth

---

## Quick Start Summary

After setting up the API keys:

1. **Add keys to your `.env` file** (copy from `.env.example`)

2. **Restart the backend server**:
   ```bash
   python main.py
   ```

3. **Open the app** and go to the **Meetings** page

4. **Click "Connect"** for each platform — you'll be redirected to authorize

5. **View your meetings** — all platforms are combined in one view

6. **Get Transcripts** — click "Get Transcript" on completed Zoom/Webex meetings

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Integration not configured" | Check that Client ID and Secret are in `.env` and server is restarted |
| "Token expired" | Disconnect and reconnect the platform |
| "No recordings found" | Meeting must have cloud recording enabled (Zoom Pro/Webex Pro) |
| Google shows "Access blocked" | Add your email as a test user in OAuth consent screen |
| Redirect URL mismatch | Ensure the URL in `.env` exactly matches what's in the platform settings |
| "Zoom not connected" | Click Connect on the Meetings page to authorize |

---

## Production Deployment

When deploying to production, update these redirect URIs:

```env
ZOOM_REDIRECT_URI=https://your-domain.com/meetings?provider=zoom
GOOGLE_REDIRECT_URI=https://your-domain.com/meetings?provider=google
WEBEX_REDIRECT_URI=https://your-domain.com/meetings?provider=webex
```

Also update the redirect URIs in each platform's developer console to match.
