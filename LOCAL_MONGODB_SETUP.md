# ARX IT CLUB - Local MongoDB Setup Guide

**Date**: October 22, 2026  
**Status**: Migration Complete, MongoDB Installation Pending

---

## 🎯 QUICK START: What You Need To Do

Your ARX application is **ready for MongoDB**, you just need to install and start MongoDB on your local machine.

---

## 📦 STEP 1: Install MongoDB (Choose One Method)

### Method A: MongoDB Installer (Recommended - 10 minutes)

1. **Download MongoDB Community Server**:
   - Go to: https://www.mongodb.com/try/download/community
   - Version: **8.0.3** (Current)
   - Platform: **Windows**
   - Package: **msi**
   - Click **"Download"** (≈200MB)

2. **Run the Installer**:
   - Double-click the downloaded `.msi` file
   - Choose **"Complete"** installation
   - ✅ Check **"Install MongoDB as a Service"**
   - Service Name: **MongoDB**
   - Data Directory: `C:\Program Files\MongoDB\Server\8.0\data\`
   - Log Directory: `C:\Program Files\MongoDB\Server\8.0\log\`
   - ✅ Optional: Install **MongoDB Compass** (GUI tool for viewing data)
   - Click **"Install"**

3. **Verify Installation**:
   ```bash
   # Open a NEW terminal and run:
   mongod --version
   
   # You should see:
   # db version v8.0.3
   ```

4. **Check Service is Running**:
   ```bash
   # In terminal:
   sc query MongoDB
   
   # You should see:
   # STATE: 4 RUNNING
   ```

---

### Method B: Portable MongoDB (No Installation - 15 minutes)

If you prefer not to install:

1. **Download Portable MongoDB**:
   - Download: https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-8.0.3.zip
   - File size: ≈450MB

2. **Extract and Setup**:
   ```bash
   # Extract to C:\mongodb
   # Create data directory:
   mkdir C:\mongodb\data
   mkdir C:\mongodb\logs
   ```

3. **Start MongoDB**:
   ```bash
   # Open terminal and run:
   cd C:\mongodb\bin
   mongod.exe --dbpath C:\mongodb\data --logpath C:\mongodb\logs\mongodb.log
   
   # Leave this terminal open while using ARX
   ```

4. **Verify Running**:
   ```bash
   # Open a NEW terminal and run:
   C:\mongodb\bin\mongosh.exe
   
   # You should see:
   # Current Mongosh Log ID: ...
   # Connecting to: mongodb://127.0.0.1:27017/...
   # test>
   
   # Type: exit
   ```

---

## 🚀 STEP 2: Start Your ARX Server

After MongoDB is installed and running:

```bash
# Navigate to your ARX project
cd "C:\Users\Nathan\Desktop\My Projects\Arx-website"

# Start the server
npm run dev
```

**Expected Output**:
```
[MongoDB] ✅ Connected successfully to MongoDB Atlas.
[FileDB] Loaded from arx_database.json: {...}
🚀 IT Club server running at http://0.0.0.0:3000
```

---

## ✅ STEP 3: Verify Everything Works

### Test 1: Server Health Check

Open your browser:
```
http://localhost:3000
```

You should see the ARX IT CLUB homepage.

### Test 2: Check MongoDB Connection

In the terminal where your server is running, look for:
```
[MongoDB] ✅ Connected successfully to MongoDB Atlas.
```

If you see this, **congratulations!** MongoDB is connected.

### Test 3: Test Data Persistence

1. **Create a test member**:
   - Go to: http://localhost:3000/#register
   - Fill out the registration form
   - Submit

2. **Stop the server** (Ctrl+C)

3. **Verify data in MongoDB**:

   **Option A: Using MongoDB Compass (GUI)**:
   - Open MongoDB Compass
   - Connect to: `mongodb://localhost:27017`
   - Database: `arx_it_club`
   - Collection: `arx_state`
   - You should see your data in the `payload` field

   **Option B: Using mongosh (Terminal)**:
   ```bash
   mongosh mongodb://localhost:27017/arx_it_club
   
   # In mongosh:
   db.arx_state.findOne()
   
   # You should see your application data
   ```

4. **Restart the server**:
   ```bash
   npm run dev
   ```

5. **Verify member exists**:
   - The member you created should still be there
   - Data persisted to MongoDB! ✅

---

## 🔧 TROUBLESHOOTING

### Error: "MongoDB connection failed"

**Check if MongoDB is running**:
```bash
# For Service Installation:
sc query MongoDB

# For Portable Installation:
# Make sure mongod.exe terminal is still open
```

**Restart MongoDB Service**:
```bash
# Stop
net stop MongoDB

# Start
net start MongoDB
```

### Error: "Port 3000 already in use"

**Kill the process**:
```bash
# Find the process
netstat -ano | findstr :3000

# Kill it (replace PID with actual number)
taskkill //F //PID <PID>
```

### MongoDB Service Won't Start

**Start manually**:
```bash
"C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe" --config "C:\Program Files\MongoDB\Server\8.0\bin\mongod.cfg"
```

### Data Not Persisting

**Check your .env file**:
```bash
# Verify these lines exist:
DATABASE_PROVIDER=mongodb
MONGODB_URI=mongodb://localhost:27017/arx_it_club
```

---

## 🌐 NGROK SETUP (For External Access)

Once your local MongoDB is working, you can expose your backend via ngrok:

### Step 1: Install ngrok

```bash
# Download from: https://ngrok.com/download
# Or install via npm (already in package.json):
npm install -g ngrok
```

### Step 2: Start ngrok Tunnel

```bash
# In a NEW terminal window:
ngrok http 3000
```

You'll see:
```
Forwarding    https://abc123.ngrok.io -> http://localhost:3000
```

### Step 3: Update .env with ngrok URL

```bash
# In your .env file:
APP_URL=https://abc123.ngrok.io
```

### Step 4: Restart Server

```bash
npm run dev
```

**Important**: 
- ✅ ngrok exposes your **backend API only**
- ✅ MongoDB remains **local and private**
- ✅ No direct MongoDB internet access

**Architecture**:
```
Internet → ngrok → ARX Backend API → Local MongoDB
                                    (localhost:27017)
```

---

## 📊 YOUR CURRENT CONFIGURATION

Your `.env` file is configured as:

```bash
# Database
DATABASE_PROVIDER=mongodb
MONGODB_URI=mongodb://localhost:27017/arx_it_club

# Server
PORT=3000
NODE_ENV=development
APP_URL=http://localhost:3000
```

This means:
- ✅ MongoDB is the primary database
- ✅ Connects to **local MongoDB** (localhost:27017)
- ✅ Database name: `arx_it_club`
- ✅ No authentication required (local development)
- ✅ Falls back to `arx_database.json` if MongoDB unavailable

---

## 🎯 MIGRATION STATUS

### ✅ Completed
- [x] Removed Supabase Storage fallback code
- [x] Set MongoDB as primary database
- [x] Updated environment configuration
- [x] Created comprehensive documentation
- [x] Tested with local JSON storage
- [x] All Git commits created

### ⏸️ Pending
- [ ] Install MongoDB locally
- [ ] Start MongoDB service
- [ ] Test with local MongoDB
- [ ] Verify data persistence

---

## 📝 TESTING CHECKLIST

After MongoDB is running, test these:

### Basic Functionality
- [ ] Server starts without errors
- [ ] Homepage loads (http://localhost:3000)
- [ ] API endpoints respond (http://localhost:3000/api/settings)
- [ ] MongoDB connection confirmed in logs

### Data Persistence
- [ ] Register a new member
- [ ] Member data visible in MongoDB Compass
- [ ] Stop server
- [ ] Restart server
- [ ] Member still exists

### Admin Features
- [ ] Admin login works
- [ ] View applications
- [ ] Approve/reject members
- [ ] Issue certificates

### Telegram Bot (Optional)
- [ ] Bot responds to /start
- [ ] Commands work
- [ ] Data updates in MongoDB

---

## 🆘 NEED HELP?

### Check Server Logs
```bash
# Your server output shows connection status
# Look for these messages:

✅ Success:
[MongoDB] ✅ Connected successfully to MongoDB Atlas.

❌ Problem:
[MongoDB] ⚠️  Connection failed: connect ECONNREFUSED 127.0.0.1:27017
[MongoDB] ⚠️  Failed to sync to MongoDB. Data is saved locally.
```

### Common Solutions

**Problem**: MongoDB not connecting
**Solution**: Make sure MongoDB service is running

**Problem**: Port 3000 in use
**Solution**: Kill the old process or use a different port

**Problem**: Data not saving
**Solution**: Check `DATABASE_PROVIDER=mongodb` in .env

---

## 📚 DOCUMENTATION FILES

Created during migration:

1. **MONGODB_MIGRATION.md** - Complete MongoDB setup guide
2. **MIGRATION_REPORT.md** - Technical migration details
3. **LOCAL_MONGODB_SETUP.md** - This file (local setup guide)

---

## 🎓 WHAT YOU'VE LEARNED

- ✅ How to migrate from Supabase to MongoDB
- ✅ Local vs Cloud database architecture
- ✅ MongoDB connection strings
- ✅ Database fallback systems
- ✅ Git-based migration workflow
- ✅ ngrok for local API exposure

---

## 🚀 NEXT ACTIONS

**Right Now** (5 minutes):
1. Install MongoDB using Method A or B above
2. Verify MongoDB is running
3. Come back and continue testing

**After MongoDB is Running** (5 minutes):
1. Start ARX server: `npm run dev`
2. Verify MongoDB connection in logs
3. Test registration form
4. Check data in MongoDB Compass

**Optional** (10 minutes):
1. Install ngrok
2. Start ngrok tunnel
3. Update APP_URL in .env
4. Test external access

---

## ✅ SUCCESS CRITERIA

You'll know everything is working when:

1. **Server starts** with no MongoDB errors
2. **MongoDB log shows**: `[MongoDB] ✅ Connected successfully`
3. **You can register** a test member
4. **Data persists** after server restart
5. **MongoDB Compass** shows your data

---

**Last Updated**: October 22, 2026 at 15:01 UTC  
**Status**: Ready for MongoDB installation  
**Estimated Time to Complete**: 15-20 minutes

---

## 🎉 YOU'RE ALMOST THERE!

The hard work is done - the migration is complete and your code is ready.  
Just install MongoDB and you'll have a fully local, production-ready database!

**Questions?** Check the troubleshooting section or refer to the other documentation files.

**Good luck!** 🚀
