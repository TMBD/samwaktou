/// <reference types="node" />

/**
 * @file migrate-admin-roles.ts
 * @description One-time migration script for Phase 1: Admin Role System.
 *
 * This script performs the following transformations on the `admins` collection:
 *
 * 1. **`isSuperAdmin: true`  → `role: 'SYSTEM_ADMIN'`**
 * 2. **`isSuperAdmin: false` → `role: 'CONTRIBUTOR'`**  (safe default)
 * 3. **Removes the `isSuperAdmin` field** from all documents.
 * 4. **Sets `isActive: true`** on every document that doesn't already have it.
 *
 * The script connects directly to MongoDB using the same connection string
 * template and credentials from environment variables (identical to the app).
 *
 * Usage:
 *   1. Ensure the required environment variables are set (or use a `.env` file).
 *   2. Run: `npx tsx scripts/migrate-admin-roles.ts`
 *
 * Safety:
 *   - The script is **idempotent**: re-running it on already-migrated documents
 *     is harmless because it only touches docs where `isSuperAdmin` still exists.
 *   - A dry-run summary is logged before any writes are performed.
 */

import mongoose from 'mongoose';

/* ── 1. Read environment variables ───────────────────────────────────── */

const DB_CONNECTION = process.env.DB_CONNECTION;
const MONGODB_USERNAME = process.env.MONGODB_USERNAME;
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME;

if (!DB_CONNECTION || !MONGODB_USERNAME || !MONGODB_PASSWORD || !MONGODB_DB_NAME) {
  console.error(
    '❌ Missing required environment variables: DB_CONNECTION, MONGODB_USERNAME, MONGODB_PASSWORD, MONGODB_DB_NAME',
  );
  process.exit(1);
}

/** Build the final connection URI by replacing template placeholders. */
const connectionUri = DB_CONNECTION
  .replace('<username>', MONGODB_USERNAME)
  .replace('<password>', MONGODB_PASSWORD)
  .replace('<db_name>', MONGODB_DB_NAME);

/* ── 2. Connect to MongoDB ───────────────────────────────────────────── */

async function run(): Promise<void> {
  console.log('🔌 Connecting to MongoDB…');
  await mongoose.connect(connectionUri);
  console.log('✅ Connected.\n');

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection is not available.');
  }

  const collection = db.collection('admins');

  /* ── 3. Analyse current state ────────────────────────────────────── */

  const totalDocs = await collection.countDocuments();
  const superAdmins = await collection.countDocuments({ isSuperAdmin: true });
  const regularAdmins = await collection.countDocuments({ isSuperAdmin: false });
  const alreadyMigrated = await collection.countDocuments({ role: { $exists: true } });
  const missingIsActive = await collection.countDocuments({ isActive: { $exists: false } });

  console.log('📊 Current state of the "admins" collection:');
  console.log(`   Total documents:           ${totalDocs}`);
  console.log(`   isSuperAdmin = true:       ${superAdmins}`);
  console.log(`   isSuperAdmin = false:      ${regularAdmins}`);
  console.log(`   Already have "role" field: ${alreadyMigrated}`);
  console.log(`   Missing "isActive" field:  ${missingIsActive}`);
  console.log('');

  /* ── 4. Migrate isSuperAdmin → role ──────────────────────────────── */

  // Step 4a: isSuperAdmin: true → role: SYSTEM_ADMIN
  const superResult = await collection.updateMany(
    { isSuperAdmin: true },
    {
      $set: { role: 'SYSTEM_ADMIN' },
      $unset: { isSuperAdmin: '' },
    },
  );
  console.log(`✏️  isSuperAdmin=true  → SYSTEM_ADMIN:  ${superResult.modifiedCount} doc(s) updated.`);

  // Step 4b: isSuperAdmin: false → role: CONTRIBUTOR
  const regularResult = await collection.updateMany(
    { isSuperAdmin: false },
    {
      $set: { role: 'CONTRIBUTOR' },
      $unset: { isSuperAdmin: '' },
    },
  );
  console.log(`✏️  isSuperAdmin=false → CONTRIBUTOR:   ${regularResult.modifiedCount} doc(s) updated.`);

  // Step 4c: Safety net — any doc still lacking a `role` field gets CONTRIBUTOR.
  const fallbackResult = await collection.updateMany(
    { role: { $exists: false } },
    { $set: { role: 'CONTRIBUTOR' } },
  );
  if (fallbackResult.modifiedCount > 0) {
    console.log(`⚠️  Fallback (no role field):             ${fallbackResult.modifiedCount} doc(s) set to CONTRIBUTOR.`);
  }

  /* ── 5. Add isActive: true where missing ─────────────────────────── */

  const isActiveResult = await collection.updateMany(
    { isActive: { $exists: false } },
    { $set: { isActive: true } },
  );
  console.log(`✏️  isActive field added:                 ${isActiveResult.modifiedCount} doc(s) updated.`);

  /* ── 6. Remove leftover isSuperAdmin field (safety) ──────────────── */

  const cleanupResult = await collection.updateMany(
    { isSuperAdmin: { $exists: true } },
    { $unset: { isSuperAdmin: '' } },
  );
  if (cleanupResult.modifiedCount > 0) {
    console.log(`🧹 Cleaned leftover isSuperAdmin field:  ${cleanupResult.modifiedCount} doc(s).`);
  }

  /* ── 7. Verify final state ───────────────────────────────────────── */

  const finalWithRole = await collection.countDocuments({ role: { $exists: true } });
  const finalWithIsActive = await collection.countDocuments({ isActive: { $exists: true } });
  const finalWithIsSuperAdmin = await collection.countDocuments({ isSuperAdmin: { $exists: true } });

  console.log('\n📊 Final state:');
  console.log(`   Documents with "role":         ${finalWithRole}`);
  console.log(`   Documents with "isActive":     ${finalWithIsActive}`);
  console.log(`   Documents with "isSuperAdmin": ${finalWithIsSuperAdmin} (should be 0)`);

  if (finalWithIsSuperAdmin > 0) {
    console.warn('\n⚠️  WARNING: Some documents still have the isSuperAdmin field!');
  } else {
    console.log('\n🎉 Migration completed successfully!');
  }

  /* ── 8. Disconnect ───────────────────────────────────────────────── */

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB.');
}

/* ── Entry point ─────────────────────────────────────────────────────── */

run().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
