# 🔧 QUICK FIX: "Failed to Fetch" Error

## Problem
Vercel website shows "failed to fetch" and courses/events are empty.

## Root Cause
Vercel doesn't have the `VITE_API_URL` environment variable configured, so the frontend doesn't know where to find your backend API.

## ✅ Solution (2 minutes)

### Step-by-Step:

1. **Go to Vercel Dashboard**
   https://vercel.com/dashboard

2. **Select Your Project**
   Click on your deployed project

3. **Open Settings**
   Top menu → Click "Settings"

4. **Environment Variables**
   Left sidebar → Click "Environment Variables"

5. **Add Variable**
   ```
   Key:   VITE_API_URL
   Value: https://hesitate-posting-nacho.ngrok-free.dev
   
   Select all environments:
   ☑ Production
   ☑ Preview
   ☑ Development
   ```

6. **Save**
   Click "Save" button

7. **Redeploy**
   - Go to "Deployments" tab
   - Find latest deployment
   - Click "..." menu → "Redeploy"
   - Wait 1-2 minutes

8. **Test**
   Refresh your Vercel website
   Courses should now load!

---

## Verification

### Before Fix:
❌ Vercel frontend → (empty URL) → Failed to fetch

### After Fix:
✅ Vercel frontend → https://hesitate-posting-nacho.ngrok-free.dev → Your PC backend → MongoDB

---

## Test Backend Directly

While waiting for Vercel redeployment, test your backend:

```bash
# Open in browser or curl:
https://hesitate-posting-nacho.ngrok-free.dev/api/courses
https://hesitate-posting-nacho.ngrok-free.dev/api/settings
```

If you see JSON data → Backend works!
If Vercel still fails after redeploy → Variable wasn't set correctly

---

## Why This Happens

Your frontend code uses:
```javascript
const API_BASE = import.meta.env.VITE_API_URL
```

Vite replaces `import.meta.env.VITE_API_URL` with the actual value at **build time**.

Without the environment variable:
- `VITE_API_URL` = `undefined`
- Fetch URLs become: `undefined/api/courses`
- Result: "Failed to fetch"

With the environment variable:
- `VITE_API_URL` = `https://hesitate-posting-nacho.ngrok-free.dev`
- Fetch URLs become: `https://hesitate-posting-nacho.ngrok-free.dev/api/courses`
- Result: ✅ Data loads

---

## Alternative: Check if Variable Exists

To verify variable is set correctly in Vercel:

1. Go to Settings → Environment Variables
2. Look for `VITE_API_URL`
3. Value should be: `https://hesitate-posting-nacho.ngrok-free.dev`
4. All three environments should be checked ✅

If missing or wrong → Update and redeploy

---

## After Fix Works

Once courses load, test full pipeline:

1. Register new account
2. Check MongoDB Compass → New member appears
3. Login with that account
4. Update profile → Changes save to MongoDB

This confirms: Vercel → ngrok → Backend → MongoDB ✅

---

**Time to fix: 2 minutes**
**Let me know when you've set the variable and I'll help verify!**
