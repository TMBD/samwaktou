/// <reference types="node" />

/**
 * @file seed-themes.ts
 * @description One-time migration script for Phase 2: Seed Themes from existing audio data.
 *
 * This script performs the following:
 *
 * 1. Connects to MongoDB using the same env vars as the application.
 * 2. Fetches all distinct `theme` values from the `audios` collection.
 * 3. For each unique theme, creates a Theme document (if it doesn't already exist)
 *    marked as `isValidated: true` (since these are legacy, already-published themes).
 * 4. The `createdBy` field is set to the first SYSTEM_ADMIN found in the `admins`
 *    collection (or a placeholder if none exists).
 *
 * Usage:
 *   1. Ensure the required environment variables are set (or use a `.env` file).
 *   2. Run: `npx tsx scripts/seed-themes.ts`
 *
 * Safety:
 *   - The script is **idempotent**: re-running it will skip themes that already exist.
 *   - A summary of created / skipped themes is logged at the end.
 */

import mongoose from 'mongoose';

/* ── 1. Read environment variables ───────────────────────────────────── */

const {
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_AUTH_SOURCE,
} = process.env;

if (!DB_USER || !DB_PASSWORD || !DB_HOST || !DB_PORT || !DB_NAME) {
  console.error(
    '❌ Missing required environment variables: DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME',
  );
  process.exit(1);
}

const authSource = DB_AUTH_SOURCE ?? 'admin';
const uri = `mongodb://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?authSource=${authSource}`;

/* ── 2. Minimal Mongoose schemas (standalone — no app imports) ────────── */

/**
 * Lightweight Audio schema — only the `theme` field is needed for this migration.
 */
const AudioSchema = new mongoose.Schema({ theme: String });
const AudioModel = mongoose.model('Audio', AudioSchema);

/**
 * Lightweight Admin schema — used to find a SYSTEM_ADMIN for the `createdBy` field.
 */
const AdminSchema = new mongoose.Schema({ role: String });
const AdminModel = mongoose.model('Admin', AdminSchema);

/**
 * Theme schema matching the application's Theme model.
 */
const ThemeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, uppercase: true, trim: true },
    isValidated: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
    validatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  },
  { timestamps: true },
);
const ThemeModel = mongoose.model('Theme', ThemeSchema);

/* ── 3. Main migration logic ─────────────────────────────────────────── */

async function main(): Promise<void> {
  console.log('🔌 Connecting to MongoDB…');
  await mongoose.connect(uri);
  console.log('✅ Connected.\n');

  // Find a SYSTEM_ADMIN to use as createdBy / validatedBy.
  const sysAdmin = await AdminModel.findOne({ role: 'SYSTEM_ADMIN' }).lean();
  if (!sysAdmin) {
    console.error(
      '⚠️  No SYSTEM_ADMIN found in the admins collection. Please create one first,\n' +
      '   or run the migrate-admin-roles script before this one.',
    );
    await mongoose.disconnect();
    process.exit(1);
  }
  const adminId = sysAdmin._id;
  console.log(`📌 Using SYSTEM_ADMIN "${adminId}" as createdBy for seeded themes.\n`);

  // Get all distinct theme values from existing audios.
  const rawThemes: string[] = await AudioModel.distinct('theme');

  // Normalise: trim, upper-case, remove blanks, deduplicate.
  const uniqueThemes = [
    ...new Set(
      rawThemes
        .map((t) => t?.trim().toUpperCase())
        .filter((t): t is string => !!t && t.length > 0),
    ),
  ].sort();

  console.log(`📊 Found ${uniqueThemes.length} unique theme(s) in the audios collection.\n`);

  let created = 0;
  let skipped = 0;

  for (const name of uniqueThemes) {
    const existing = await ThemeModel.findOne({ name }).lean();

    if (existing) {
      console.log(`  ⏭️  "${name}" — already exists, skipping.`);
      skipped++;
      continue;
    }

    await ThemeModel.create({
      name,
      isValidated: true,
      createdBy: adminId,
      validatedBy: adminId,
    });

    console.log(`  ✅ "${name}" — created.`);
    created++;
  }

  /* ── 4. Summary ──────────────────────────────────────────────────────── */
  console.log('\n─── Migration summary ───');
  console.log(`  Created : ${created}`);
  console.log(`  Skipped : ${skipped}`);
  console.log(`  Total   : ${uniqueThemes.length}`);
  console.log('─────────────────────────\n');

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB. Done.');
}

/* ── Entry point ─────────────────────────────────────────────────────── */

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
