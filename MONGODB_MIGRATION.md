# ARX IT CLUB - MongoDB Migration Guide

## Migration Complete ✅

ARX IT CLUB has successfully migrated from Supabase Storage + Local JSON to **MongoDB Atlas** as the primary database backend.

---

## What Changed

### ✅ Completed
1. **Removed Supabase Storage fallback** - No longer using Supabase for database backup
2. **Set MongoDB as primary database** - All data now persists to MongoDB Atlas
3. **Updated environment configuration** - `.env.example` reflects MongoDB priority
4. **Cleaned up obsolete code** - Removed 95 lines of unused Supabase logic

### 🎯 Current Architecture

```
ARX Frontend (React/Vanilla JS)
    ↓
ARX Backend API (Express/Node.js)
    ↓
MongoDB Atlas (Primary Database)
    ↓
Local JSON (Fallback Cache)
```

### 📦 Database Priority Order

1. **MongoDB Atlas** (Primary) - When `MONGODB_URI` is configured
2. **Neon PostgreSQL** (Legacy Fallback) - When `DATABASE_URL` is configured  
3. **Local JSON File** (`arx_database.json`) - Always available as cache/fallback

---

## MongoDB Setup Instructions

### Step 1: Create MongoDB Atlas Account

1. Go to [https://cloud.mongodb.com/](https://cloud.mongodb.com/)
2. Sign up for a **Free M0 Cluster** (512MB storage, perfect for development)
3. Create a new project called "ARX IT CLUB"

### Step 2: Create Database Cluster

1. Click **"Build a Database"**
2. Select **M0 FREE** tier
3. Choose your preferred cloud provider (AWS recommended)
4. Select a region closest to your users
5. Name your cluster: `arx-cluster`
6. Click **"Create"**

### Step 3: Configure Database Access

1. Go to **Database Access** in the left sidebar
2. Click **"Add New Database User"**
3. Create credentials:
   - Username: `arx_admin` (or your choice)
   - Password: Generate a **strong password** (save it securely!)
4. Set privileges to **"Read and write to any database"**
5. Click **"Add User"**

### Step 4: Configure Network Access

1. Go to **Network Access** in the left sidebar
2. Click **"Add IP Address"**
3. For development: Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - ⚠️ For production, restrict to your server's IP address
4. Click **"Confirm"**

### Step 5: Get Connection String

1. Go back to **Database** in the sidebar
2. Click **"Connect"** on your cluster
3. Select **"Connect your application"**
4. Choose **Node.js** driver
5. Copy the connection string
6. It will look like:
   ```
   mongodb+srv://arx_admin:<password>@arx-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Step 6: Configure ARX Backend

1. Open your `.env` file
2. Update the MongoDB connection string:
   ```bash
   DATABASE_PROVIDER=mongodb
   MONGODB_URI=mongodb+srv://arx_admin:YOUR_ACTUAL_PASSWORD@arx-cluster.xxxxx.mongodb.net/arx_it_club?retryWrites=true&w=majority
   ```
   
   **Replace:**
   - `YOUR_ACTUAL_PASSWORD` with the password you created in Step 3
   - `arx-cluster.xxxxx.mongodb.net` with your actual cluster hostname
   - Add `/arx_it_club` before the `?` to specify the database name

3. Save the file

### Step 7: Start the Server

```bash
npm run dev
```

You should see:
```
[MongoDB] ✅ Connected successfully to MongoDB Atlas.
[FileDB] Loaded from arx_database.json: {...}
🚀 IT Club server running at http://0.0.0.0:3000
```

---

## Data Migration

### Automatic Migration

The system automatically handles data migration:

1. **First startup with MongoDB**:
   - Reads existing data from `arx_database.json`
   - Uploads entire state to MongoDB
   - Confirms successful migration in console

2. **Subsequent startups**:
   - Reads from MongoDB (primary)
   - Syncs to local file (cache)
   - All writes go to MongoDB first

### Manual Verification

Check that your data migrated successfully:

1. Go to MongoDB Atlas → **Browse Collections**
2. Select your cluster → Database: `arx_it_club`
3. Collection: `arx_state`
4. You should see a document with `key: "global"`
5. The `payload` field contains your entire application state

---

## Environment Variables

### Required for MongoDB

```bash
# Primary database provider
DATABASE_PROVIDER=mongodb

# MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/arx_it_club?retryWrites=true&w=majority
```

### Optional (Legacy Fallback)

```bash
# Neon PostgreSQL (only if you want dual-database setup)
DATABASE_URL=postgresql://user:password@host.neon.tech/db?sslmode=require
```

---

## Security Hardening

### ✅ Already Implemented

1. **MongoDB is NOT publicly exposed** - Only backend API can access it
2. **Connection string in environment variables** - Never hardcoded
3. **Automatic connection pooling** - Managed by Mongoose
4. **Secure authentication** - Username/password + IP whitelist
5. **Connection timeout limits** - 8 second server selection timeout
6. **Automatic reconnection** - On connection drop

### 🔒 Production Recommendations

1. **Restrict IP Access**:
   - Remove "0.0.0.0/0" from Network Access
   - Add only your production server's IP address

2. **Use Database-Specific User**:
   - Create a user with access only to `arx_it_club` database
   - Don't use cluster admin credentials

3. **Enable MongoDB Encryption**:
   - Already enabled by default on Atlas (encryption at rest)
   - Connection uses TLS/SSL (mongodb+srv://)

4. **Rotate Credentials Regularly**:
   - Change database password every 90 days
   - Update `.env` file after rotation

5. **Monitor Database Access**:
   - Check MongoDB Atlas → Metrics for unusual activity
   - Enable alerts for high connection counts

---

## Troubleshooting

### Error: "MongoDB connection failed"

**Solution**: Check your connection string
```bash
# Verify your .env file has:
DATABASE_PROVIDER=mongodb
MONGODB_URI=mongodb+srv://...actual-connection-string...
```

### Error: "Authentication failed"

**Solution**: 
1. Double-check username and password in connection string
2. Ensure password is URL-encoded (no special characters like `@`, `:`, `/`)
3. Use MongoDB Atlas to reset the user password

### Error: "IP not whitelisted"

**Solution**:
1. Go to MongoDB Atlas → Network Access
2. Add your current IP address or use 0.0.0.0/0 for development

### Error: "Database empty after migration"

**Solution**:
1. Check that `arx_database.json` exists in project root
2. Restart the server - it will auto-seed MongoDB from local file
3. Check MongoDB Atlas → Browse Collections to verify data

### Data not persisting

**Verify MongoDB is primary**:
```bash
# Check .env file:
DATABASE_PROVIDER=mongodb  # Must be "mongodb", not "local" or "neon"
```

---

## Testing

### Verify MongoDB Connection

```bash
node -e "
import('dotenv/config').then(() => {
  import('mongoose').then(m => {
    const mongoose = m.default;
    const uri = process.env.MONGODB_URI;
    mongoose.connect(uri).then(() => {
      console.log('✅ MongoDB connection successful!');
      process.exit(0);
    }).catch(err => {
      console.error('❌ MongoDB connection failed:', err.message);
      process.exit(1);
    });
  });
});
"
```

### Test Data Persistence

1. Start the server: `npm run dev`
2. Create a test member via the registration form
3. Stop the server (Ctrl+C)
4. Check MongoDB Atlas → Browse Collections
5. Verify the new member appears in the `payload.members` array
6. Restart the server
7. Confirm the member still exists

---

## Rollback Plan (If Needed)

If you need to temporarily revert to local file storage:

1. Open `.env`
2. Change:
   ```bash
   DATABASE_PROVIDER=local
   ```
3. Restart server
4. Data will read/write from `arx_database.json`

**Note**: This is only for emergencies. MongoDB is the recommended production database.

---

## Performance Benefits

### MongoDB vs Local JSON

| Feature | Local JSON | MongoDB Atlas |
|---------|-----------|---------------|
| **Concurrent Access** | ❌ File locking issues | ✅ Multiple connections |
| **Data Integrity** | ⚠️ Risk of corruption | ✅ ACID transactions |
| **Scalability** | ❌ Limited to file size | ✅ Horizontally scalable |
| **Query Performance** | ❌ Full file read | ✅ Indexed queries |
| **Backup/Restore** | ⚠️ Manual file copies | ✅ Automated snapshots |
| **Cloud Deployment** | ⚠️ Ephemeral storage | ✅ Persistent storage |

---

## Git Waypoints

### Migration Commits

1. **190ae37** - `chore: initial commit before database migration`
2. **72303f4** - `chore: remove obsolete Supabase Storage fallback code`
3. **00a1e4b** - `fix: remove duplicate .env* pattern from .gitignore`

---

## Support

### Documentation
- MongoDB Atlas Docs: [https://docs.atlas.mongodb.com/](https://docs.atlas.mongodb.com/)
- Mongoose Docs: [https://mongoosejs.com/docs/](https://mongoosejs.com/docs/)

### Need Help?
- Check MongoDB connection status in Atlas dashboard
- Review server console logs for error details
- Verify all environment variables are set correctly

---

**Last Updated**: October 22, 2026
**Migration Status**: ✅ Complete
**Database**: MongoDB Atlas (Primary)
