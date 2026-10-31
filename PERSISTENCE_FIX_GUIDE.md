# ARX IT CLUB - Data Persistence & Registration Flow Fix Guide

> **Current Vercel + local MongoDB setup:** The sections below include historical Atlas guidance and are not the current configuration. For the agreed setup, run the Node API and MongoDB on your PC, expose only the Node API through ngrok, and set Vercel's `VITE_API_URL` to the ngrok HTTPS URL.
>
> In your local `.env`, use `DATABASE_PROVIDER=mongodb` and `MONGODB_URI=mongodb://127.0.0.1:27017/arx_it_club`. Start the local server with `npm run dev`; it attempts to start ngrok and prints the URL. In Vercel **Project → Settings → Environment Variables**, set `VITE_API_URL=https://<your-ngrok-host>` with no trailing slash, then redeploy. The Vercel CSP permits standard ngrok domains. Never tunnel MongoDB port `27017`.
>
> The PC, MongoDB, Node server, and ngrok must remain online. A changing ngrok URL requires updating `VITE_API_URL` and redeploying; use a reserved ngrok domain for a stable URL. Vercel does not need `MONGODB_URI` in this setup.

**Date**: 2026-10-27  
**Issues Fixed**:
1. Registration flow - removed activation code section
2. MongoDB persistence - local vs cloud configuration
3. Vercel/ngrok networking stability

---

## Issue 1: Registration Flow - Activation Code Removed ✅

### What Was Fixed
- Removed unused activation code UI components from `register.js`
- Updated success screen to show "Registration Successful - Waiting for Admin Approval"
- Clarified automated notification flow (email + Telegram)

### Changes Made
```javascript
// Removed variables:
- activatedSuccessData
- activationCodeInput
- activatingAccount
- activationError

// Updated registration success message:
- Now shows: "Waiting for Admin Approval" status
- Displays Login ID immediately
- Shows automated notification flow steps
```

---

## Issue 2: MongoDB Persistence Problem ⚠️ ACTION REQUIRED

### Persistence Configuration
The server now uses the backend explicitly selected by `DATABASE_PROVIDER`:

- `local` writes to the project-root `arx_database.json` file and persists across local server restarts.
- `mongodb` uses the URI in `MONGODB_URI` (local MongoDB or Atlas).
- `neon` uses Neon PostgreSQL and requires `DATABASE_URL`.

The server reports database write failures instead of confirming registrations that were not saved.

### Vercel Frontend + ngrok + MongoDB on Your PC

The browser sends API requests from the Vercel site through the HTTPS ngrok tunnel to the Node.js server running on your PC. That server connects to MongoDB on the same PC. Keep MongoDB, the Node server, ngrok, and your PC online whenever the site needs its API.

1. Make sure MongoDB is running locally and set these values in your **local `.env`**:
   ```env
   DATABASE_PROVIDER=mongodb
   MONGODB_URI=mongodb://127.0.0.1:27017/arx_it_club
   ```
2. Install and authenticate ngrok if needed. Start the API server with `npm run dev`; it attempts to start ngrok and prints the public HTTPS URL. Do not expose MongoDB's port `27017` through ngrok.
3. In Vercel, open **Project → Settings → Environment Variables** and set `VITE_API_URL` to the ngrok HTTPS URL, with no trailing slash. This is a frontend build-time setting; redeploy after changing it.
4. If you have a custom Vercel domain, add its exact origin to `ALLOWED_ORIGINS` in your local `.env`, then restart the server. The built-in CORS rule already allows `*.vercel.app` origins.

The Vercel Content Security Policy permits HTTPS connections to standard ngrok domains. If you use an ngrok reserved/custom domain outside those domains, update `connect-src` in `vercel.json` to include that exact HTTPS origin.

With a free, changing ngrok URL, update `VITE_API_URL` and redeploy whenever the URL changes. A reserved ngrok domain avoids that repeated update. If your PC, MongoDB, Node server, or tunnel is offline, API requests will fail; this is not an always-on production architecture. Vercel does not need `MONGODB_URI` in this setup because it does not connect to MongoDB directly.

### Alternative: MongoDB Atlas for Deployment

#### Step 1: Create MongoDB Atlas Account (Free)
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free tier (512MB storage, sufficient for your app)
3. Create a new cluster (choose AWS/us-east-1 for best Vercel performance)

#### Step 2: Get Connection String
1. In Atlas dashboard, click "Connect" → "Connect your application"
2. Copy the connection string (looks like):
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/arx_it_club?retryWrites=true&w=majority
   ```

#### Step 3: Update .env File
```env
# Replace local MongoDB with Atlas cloud connection
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/arx_it_club?retryWrites=true&w=majority
```

#### Step 4: Add to Vercel Environment Variables
1. Go to Vercel dashboard → Your project → Settings → Environment Variables
2. Add `MONGODB_URI` with your Atlas connection string
3. Select all environments (Production, Preview, Development)
4. Redeploy your application

---

## Issue 3: Vercel + ngrok + MongoDB Networking

For the local-database tunnel setup, the browser talks to the ngrok URL, not Vercel's serverless API function. `VITE_API_URL` selects that API host, Vercel's `connect-src` policy permits the request, and the local Express server allows Vercel origins via CORS.

---

## Issue 4: Data Not Persisting Between Requests

### Verification Checklist

After switching to MongoDB Atlas, verify:

```bash
# 1. Check environment variable is loaded
echo $MONGODB_URI  # Should show Atlas connection string

# 2. Start server and watch logs
npm run dev
# Look for: "[MongoDB] ✅ Connected successfully to MongoDB Atlas."

# 3. Register a test user
# 4. Refresh page / restart server
# 5. Login with same credentials - should work!

# 6. Check admin panel
# Applications should persist across refreshes
```

### Common Issues & Solutions

**Issue**: "MongoDB connection failed"
```bash
# Solution: Check IP whitelist in Atlas
# 1. Go to Atlas → Network Access
# 2. Add IP Address → "0.0.0.0/0" (allows all IPs)
# Note: For production, restrict to Vercel IPs only
```

**Issue**: "Authentication failed"
```bash
# Solution: Verify username/password in connection string
# Make sure special characters in password are URL-encoded
# Example: p@ssw0rd! → p%40ssw0rd%21
```

**Issue**: Data still not persisting
```bash
# Check if MongoDB is actually being used:
grep -r "isMongoConfigured" backend/src/services/mongoService.js

# Should return true when MONGODB_URI is set correctly
```

---

## Testing the Complete Flow

### Test 1: Registration & Approval Flow
1. **Register** new student account
   - Fill all fields
   - Select 2 course tracks
   - Submit application
   - ✅ Should see: "Registration Successful - Waiting for Admin Approval"
   - ✅ Should display Member ID (e.g., ARX-STU-2024-001)

2. **Verify Persistence**
   - Refresh the page
   - Go to `/71354caa6bea2251/applications`
   - ✅ Application should appear in pending list

3. **Admin Approval**
   - Click "Approve" on application
   - ✅ Student should receive automated email (if email provided)
   - ✅ Student should receive Telegram message (if Telegram linked)

4. **Student Login**
   - Go to `/login`
   - Enter Member ID and password
   - ✅ Should successfully log in to student portal

### Test 2: Data Persistence Across Restarts
```bash
# 1. Register a student
# 2. Restart the server: Ctrl+C then npm run dev
# 3. Check admin panel - student should still be there
# 4. Approve the student
# 5. Restart server again
# 6. Student status should remain "approved"
```

### Test 3: ngrok + Vercel Deployment
```bash
# 1. Deploy to Vercel
# 2. Set up ngrok tunnel to Vercel URL
# 3. Register through ngrok URL
# 4. Close ngrok, start new tunnel
# 5. Check admin panel - data should persist
```

---

## Monitoring & Debugging

### Check MongoDB Connection Status
```javascript
// Add to backend startup (already in mongoService.js)
if (isMongoConfigured) {
  console.log('[MongoDB] ✅ Configured and ready');
} else {
  console.warn('[MongoDB] ⚠️  Not configured - using local file storage');
}
```

### View Database Contents
```bash
# Use MongoDB Compass (GUI tool)
# Download: https://www.mongodb.com/products/compass
# Connect with your MONGODB_URI
# Navigate to: arx_it_club → arx_state → documents
```

### Common Console Messages

**Good Signs:**
```
[MongoDB] ✅ Connected successfully to MongoDB Atlas.
[MongoDB] ✅ State loaded from MongoDB. Members: 5
[FileDB] Loaded from arx_database.json: { members: 5, ... }
```

**Warning Signs:**
```
[MongoDB] ⚠️  Connection failed: ...
[MongoDB] ⚠️  Not configured - using local file storage
[Persistence] MongoDB read failed, trying fallback: ...
```

---

## Emergency Rollback Plan

If MongoDB Atlas causes issues, temporarily revert:

```env
# In .env, comment out Atlas and use local
# MONGODB_URI=mongodb+srv://...atlas.mongodb.net/...
MONGODB_URI=mongodb://localhost:27017/arx_it_club

# Make sure local MongoDB is running:
mongod --dbpath=/path/to/data
```

Then investigate Atlas connection issues before switching back.

---

## Production Deployment Checklist

Before final deployment:

- [ ] MongoDB Atlas connection string set in Vercel env vars
- [ ] IP whitelist configured in Atlas (0.0.0.0/0 for testing, restrict for prod)
- [ ] Test registration flow works end-to-end
- [ ] Test admin approval triggers email notifications
- [ ] Verify data persists after server restart
- [ ] Test with ngrok tunnel multiple times
- [ ] Backup `arx_database.json` before migration
- [ ] Monitor MongoDB Atlas metrics for connection health

---

## Summary

### Fixed ✅
1. Registration UI - removed activation code section
2. Success message - clear "waiting for admin approval" flow
3. Automated notifications - email + Telegram on approval/denial

### Action Required ⚠️
1. **Set up MongoDB Atlas account** (free tier)
2. **Update MONGODB_URI** in `.env` and Vercel
3. **Test end-to-end registration flow**
4. **Verify data persistence** across restarts

### Expected Behavior After Fix
- ✅ Students register → see success + Member ID
- ✅ Data persists across page refreshes
- ✅ Data persists across server restarts
- ✅ Data persists across ngrok reconnections
- ✅ Vercel deployment works with persistent data
- ✅ Admin approves → student receives automated email/Telegram
- ✅ Student logs in with Member ID after approval

---

**Need Help?**
- MongoDB Atlas Setup: https://www.mongodb.com/docs/atlas/getting-started/
- Vercel Environment Variables: https://vercel.com/docs/concepts/projects/environment-variables
- ARX IT CLUB Support: Check backend logs for error messages
