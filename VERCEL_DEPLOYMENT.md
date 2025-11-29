# Vercel Deployment Guide

This guide explains how to deploy the Burnout Risk Prediction System frontend to Vercel.

## Quick Fix for 404 Error

If you're seeing a `404: NOT_FOUND` error, follow these steps:

### Option 1: Set Root Directory in Vercel Dashboard (Recommended)

1. Go to your Vercel project settings
2. Navigate to **Settings** → **General**
3. Find **Root Directory** setting
4. Set it to: `frontend`
5. Save and redeploy

This tells Vercel to treat the `frontend` directory as the project root, and it will automatically detect Vite/React.

### Option 2: Use vercel.json (Already Configured)

The repository includes a `vercel.json` file that should work. If Option 1 doesn't work, ensure:

1. The `vercel.json` file is in the repository root
2. The build completes successfully (check build logs)
3. The output directory `frontend/dist` exists after build

## Deployment Steps

### 1. Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New Project**
3. Import your GitHub repository
4. Select the repository: `KonetiBalaji/Burnout_Risk_Prediction`

### 2. Configure Project Settings

**Important Settings:**
- **Framework Preset**: Vite (or leave as auto-detect)
- **Root Directory**: `frontend` (if using Option 1)
- **Build Command**: `npm run build` (if root directory is set to `frontend`)
- **Output Directory**: `dist` (if root directory is set to `frontend`)
- **Install Command**: `npm install`

**OR** if using `vercel.json` (Option 2):
- Leave Root Directory as repository root
- Vercel will use the `vercel.json` configuration

### 3. Environment Variables

Add these environment variables in Vercel dashboard (Settings → Environment Variables):

```
VITE_API_URL=https://your-backend-api-url.com/api
```

Replace `your-backend-api-url.com` with your actual backend API URL.

### 4. Deploy

1. Click **Deploy**
2. Wait for the build to complete
3. Check the deployment URL

## Troubleshooting

### Build Succeeds but 404 Error

**Symptoms**: Build completes successfully but you get 404 when accessing the site.

**Solutions**:
1. **Check Root Directory**: Ensure Root Directory is set to `frontend` in Vercel settings
2. **Verify Build Output**: Check build logs to ensure `frontend/dist` directory is created
3. **Check vercel.json**: Ensure `vercel.json` has correct `outputDirectory` path
4. **Check Routes**: Ensure `rewrites` in `vercel.json` redirect all routes to `/index.html` for SPA routing

### Build Fails

**Common Issues**:
- **Missing dependencies**: Ensure `frontend/package.json` has all required dependencies
- **TypeScript errors**: Run `npm run type-check` locally to catch errors
- **Build command fails**: Test `cd frontend && npm run build` locally first

### Assets Not Loading

**Symptoms**: Page loads but images/stylesheets don't load.

**Solutions**:
1. Check that asset paths in `index.html` are relative (start with `/`)
2. Verify `vite.config.ts` has correct `build.outDir` setting
3. Check browser console for 404 errors on specific assets

## Current Configuration

The `vercel.json` file in the repository root contains:

```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "installCommand": "cd frontend && npm install",
  "framework": null,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

This configuration:
- Builds from the `frontend` directory
- Outputs to `frontend/dist`
- Handles SPA routing (all routes → `/index.html`)
- Caches static assets

## Next Steps After Deployment

1. **Update API URL**: Set `VITE_API_URL` environment variable to your backend API
2. **Test Authentication**: Verify login functionality works
3. **Check Routes**: Test all frontend routes (dashboard, predictions, etc.)
4. **Monitor Logs**: Check Vercel function logs for any runtime errors

## Backend Deployment

The backend and ML service need to be deployed separately:
- **Backend**: Deploy to services like Railway, Render, or AWS
- **ML Service**: Deploy to services that support Python/FastAPI (Railway, Render, AWS Lambda, etc.)

Update the `VITE_API_URL` environment variable in Vercel to point to your deployed backend.

