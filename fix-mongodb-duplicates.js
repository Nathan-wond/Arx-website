/**
 * Fix MongoDB duplicate documents issue
 * This script removes old duplicate "global" documents and keeps only the latest one
 */

import mongoose from 'mongoose';
import 'dotenv/config';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env');
  process.exit(1);
}

const stateSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    exportedAt: { type: Date, default: Date.now }
  },
  { collection: 'arx_state', timestamps: true }
);

const ArxState = mongoose.model('ArxState', stateSchema);

async function fixDuplicates() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all documents with key: "global"
    const allDocs = await ArxState.find({ key: 'global' }).sort({ updatedAt: -1 }).exec();

    console.log(`\n📊 Found ${allDocs.length} documents with key: "global"\n`);

    if (allDocs.length === 0) {
      console.log('❌ No documents found!');
      process.exit(0);
    }

    if (allDocs.length === 1) {
      console.log('✅ Only one document exists - no cleanup needed');
      console.log(`   Document ID: ${allDocs[0]._id}`);
      console.log(`   Updated: ${allDocs[0].updatedAt}`);
      console.log(`   Members: ${allDocs[0].payload?.members?.length || 0}`);
      process.exit(0);
    }

    // Show all documents
    allDocs.forEach((doc, i) => {
      console.log(`Document ${i + 1}:`);
      console.log(`   _id: ${doc._id}`);
      console.log(`   createdAt: ${doc.createdAt}`);
      console.log(`   updatedAt: ${doc.updatedAt}`);
      console.log(`   exportedAt: ${doc.exportedAt}`);
      console.log(`   Members: ${doc.payload?.members?.length || 0}`);
      console.log('');
    });

    // Keep the most recently updated document
    const [latest, ...duplicates] = allDocs;

    console.log(`✅ Keeping the latest document (ID: ${latest._id})`);
    console.log(`   Updated: ${latest.updatedAt}`);
    console.log(`   Members: ${latest.payload?.members?.length || 0}`);
    console.log('');

    // Delete duplicates
    console.log(`🗑️  Deleting ${duplicates.length} duplicate document(s)...\n`);

    for (const dup of duplicates) {
      await ArxState.deleteOne({ _id: dup._id });
      console.log(`   ✅ Deleted document ${dup._id}`);
    }

    console.log('\n✅ Cleanup complete!');
    console.log('\n🔍 Verifying...');

    const remaining = await ArxState.find({ key: 'global' }).exec();
    console.log(`   Documents remaining: ${remaining.length}`);

    if (remaining.length === 1) {
      console.log(`   ✅ Only one document now exists`);
      console.log(`   Members in database: ${remaining[0].payload?.members?.length || 0}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixDuplicates();
