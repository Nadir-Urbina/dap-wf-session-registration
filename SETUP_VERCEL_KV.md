# Vercel KV Setup Instructions

This app now uses Vercel KV (Redis) for data storage instead of file-based JSON. Follow these steps to set it up:

## Setup Steps

### 1. Create a Vercel KV Database

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Navigate to the **Storage** tab
3. Click **Create Database**
4. Select **KV (Redis)**
5. Choose a name (e.g., "session-scheduler-db")
6. Select a region close to your users
7. Click **Create**

### 2. Connect KV to Your Project

1. In the KV database page, click **Connect Project**
2. Select your `dap-wf-session-registration` project
3. Vercel will automatically add the environment variables:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`

### 3. Deploy

The next deployment will automatically use Vercel KV. You can trigger a deployment by:
- Pushing a new commit to GitHub
- Or manually redeploy from the Vercel dashboard

### 4. Local Development (Optional)

If you want to test locally:

1. In your Vercel dashboard, go to your KV database
2. Click on the **.env.local** tab
3. Copy all the environment variables
4. Create a `.env.local` file in your project root
5. Paste the variables
6. Run `npm run dev`

**Note:** The `.env.local` file is already in `.gitignore` and won't be committed.

## How It Works

- All session data is stored in Vercel KV (Redis)
- Data persists across deployments
- Data is synced across all devices/instances
- Initial data is automatically created on first access
- Fast read/write operations with Redis

## Vercel KV Free Tier Limits

- 256 MB storage
- 10,000 commands per day
- More than enough for this session scheduler use case!
