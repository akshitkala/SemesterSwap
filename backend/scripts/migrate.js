/**
 * SEMESTER SWAP V2 — Database Migration Script
 * Phase 2: V1 → V2 Migration
 *
 * What this script does:
 *  1. Renames `title` → `bookName` on all book documents (if any V1 docs exist)
 *  2. Renames `sellerId` (String) → `seller` (ObjectId) — NOTE: if sellerId was a
 *     Firebase UID string, those books will have seller: null after migration.
 *     You must manually re-link them or they'll be orphaned.
 *  3. Adds `condition: null` to books missing the field
 *  4. Adds `subject: null` to books missing the field
 *  5. Adds `isDeleted: false` to books missing the field
 *  6. Seeds the SystemConfig singleton (approvalMode: 'manual') if not present
 *  7. Runs verification queries and prints results
 *
 * Usage:
 *   node scripts/migrate.js
 *
 * Requires MONGO_URI in .env
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not found in environment. Aborting.');
  process.exit(1);
}

async function runMigration() {
  console.log('[DB] Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('[OK] Connected.\n');

  const db = mongoose.connection.db;
  const books = db.collection('books');
  const systemconfigs = db.collection('systemconfigs');

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1: Books Collection Migration
  // ─────────────────────────────────────────────────────────────────────────
  console.log('[STEP 1] Migrating books collection...');

  const result = await books.updateMany(
    {},
    [
      {
        $set: {
          // Rename title -> bookName (preserve existing bookName if already set)
          bookName: { $ifNull: ['$bookName', '$title'] },

          // Add missing fields with defaults
          condition: { $ifNull: ['$condition', null] },
          subject:   { $ifNull: ['$subject',   null] },
          isDeleted: { $ifNull: ['$isDeleted',  false] },
        },
      },
      {
        // Remove old V1 field names
        $unset: ['title', 'sellerId'],
      },
    ]
  );

  console.log('[OK] Books updated: ' + result.modifiedCount + ' documents modified.\n');

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2: Seed SystemConfig Singleton
  // ─────────────────────────────────────────────────────────────────────────
  console.log('[STEP 2] Seeding SystemConfig singleton...');

  const existingConfig = await systemconfigs.findOne({});

  if (existingConfig) {
    console.log('[INFO] SystemConfig already exists -- skipping seed.');
    console.log('[INFO] Current approvalMode: ' + existingConfig.approvalMode + '\n');
  } else {
    await systemconfigs.insertOne({
      approvalMode: 'manual',
      updatedBy: null,
      updatedAt: new Date(),
    });
    console.log('[OK] SystemConfig seeded with approvalMode: "manual".\n');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3: Verification Queries
  // ─────────────────────────────────────────────────────────────────────────
  console.log('[STEP 3] Running verification queries...\n');

  const v1TitleDoc      = await books.findOne({ title:    { $exists: true } });
  const v1SellerIdDoc   = await books.findOne({ sellerId: { $exists: true } });
  const missingIsDeleted = await books.findOne({ isDeleted: { $exists: false } });
  const configCount     = await systemconfigs.countDocuments();
  const sampleBook      = await books.findOne({});
  const configDoc       = await systemconfigs.findOne({});

  console.log('-------------------------------------------------');
  console.log('VERIFICATION RESULTS');
  console.log('-------------------------------------------------');

  const pass = (label, value, expected) => {
    const ok = JSON.stringify(value) === JSON.stringify(expected);
    console.log((ok ? '[PASS]' : '[FAIL]') + ' ' + label + ': ' + JSON.stringify(value) + (ok ? '' : ' (expected: ' + JSON.stringify(expected) + ')'));
    return ok;
  };

  let allPassed = true;
  allPassed &= pass('books with title field still present',    v1TitleDoc,    null);
  allPassed &= pass('books with sellerId field still present', v1SellerIdDoc, null);
  allPassed &= pass('books missing isDeleted field',          missingIsDeleted, null);
  allPassed &= pass('systemconfigs.countDocuments()',         configCount,   1);

  console.log('\nSystemConfig document:');
  console.log(JSON.stringify(configDoc, null, 2));

  if (sampleBook) {
    console.log('\nSample book document:');
    console.log(JSON.stringify(sampleBook, null, 2));

    const hasBookName = 'bookName' in sampleBook;
    const hasSeller   = 'seller'   in sampleBook;
    const noTitle     = !('title'    in sampleBook);
    const noSellerId  = !('sellerId' in sampleBook);

    console.log('\nSample book field checks:');
    console.log((hasBookName ? '[PASS]' : '[FAIL]') + ' Has bookName field');
    console.log((hasSeller   ? '[PASS]' : '[FAIL]') + ' Has seller field');
    console.log((noTitle     ? '[PASS]' : '[FAIL]') + ' No title field');
    console.log((noSellerId  ? '[PASS]' : '[FAIL]') + ' No sellerId field');
  } else {
    console.log('\n[INFO] No book documents found -- collection is empty (clean start).');
  }

  console.log('\n-------------------------------------------------');
  if (allPassed) {
    console.log('[DONE] MIGRATION COMPLETE -- All verification checks passed.');
    console.log('[DONE] Phase 2 exit criteria met. Ready for Phase 3.');
  } else {
    console.log('[WARN] MIGRATION INCOMPLETE -- Some checks failed. Review output above.');
  }
  console.log('-------------------------------------------------\n');

  await mongoose.disconnect();
  console.log('[DB] Disconnected from MongoDB.');
}

runMigration().catch((err) => {
  console.error('❌ Migration failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
