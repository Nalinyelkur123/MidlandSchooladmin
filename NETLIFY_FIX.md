# Fix 404 Error on Netlify - Quick Solutions

## Problem
Getting `404 (Not Found)` for `/api/midland/auth/admin/login` on Netlify.

## Root Cause
Netlify Functions are not deployed when you manually upload the build folder.

## Solution Options

### ✅ Option 1: Deploy Function via Netlify CLI (RECOMMENDED)

**Quick Steps:**

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify:**
   ```bash
   netlify login
   ```

3. **Link your site:**
   ```bash
   cd schooladmin
   netlify link
   ```
   - Select your site: `hilarious-gingersnap-b05848`

4. **Deploy the function:**
   ```bash
   netlify functions:deploy proxy
   ```
   
   Or deploy everything:
   ```bash
   npm run build
   netlify deploy --prod --dir=build --functions=netlify/functions
   ```

### ✅ Option 2: Set Environment Variable in Netlify Dashboard

If your backend supports HTTPS, you can bypass the proxy:

1. Go to Netlify Dashboard → Your Site → **Site settings** → **Environment variables**
2. Add new variable:
   - **Key:** `REACT_APP_API_BASE_URL`
   - **Value:** `https://4.198.16.72.nip.io` (or `http://` if HTTPS not supported)
3. **Rebuild** your site (or redeploy)

**Note:** If backend doesn't support HTTPS, you'll still get mixed content errors. Use Option 1 instead.

### ✅ Option 3: Use Git Deployment (BEST)

1. Push your code to GitHub/GitLab
2. Connect repository to Netlify
3. Netlify will automatically build and deploy functions

## Quick Test

After deploying the function, test:
```
https://hilarious-gingersnap-b05848.netlify.app/api/midland/auth/admin/login
```

Should return JSON response (not 404).

## Verify Function is Deployed

1. Go to Netlify Dashboard → Your Site → **Functions** tab
2. You should see `proxy` function listed
3. Check function logs for any errors

## Troubleshooting

**Still getting 404?**
- Function not deployed → Use Option 1
- Check Netlify Function logs
- Verify `netlify.toml` redirect rule is correct

**Mixed content error?**
- Backend doesn't support HTTPS → Must use proxy function (Option 1)
- Or set `REACT_APP_API_BASE_URL` to HTTPS URL if backend supports it

