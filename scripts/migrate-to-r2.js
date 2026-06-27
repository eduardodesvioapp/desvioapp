import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config({ path: "../.env.local" });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.VITE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.VITE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.VITE_R2_SECRET_ACCESS_KEY
  }
});

const BUCKETS = ["avatars", "media", "verification"];
const R2_BUCKET = process.env.VITE_R2_BUCKET_NAME;

async function migrateBucket(bucketName) {
  console.log(`\n📁 Migrating bucket: ${bucketName}`);

  const { data: files, error: listError } = await supabase.storage
    .from(bucketName)
    .list("", { limit: 1000, sortBy: { column: "created_at", order: "asc" } });

  if (listError) {
    console.error(`Error listing ${bucketName}:`, listError);
    return { total: 0, success: 0, failed: 0 };
  }

  if (!files || files.length === 0) {
    console.log(`  No files found in ${bucketName}`);
    return { total: 0, success: 0, failed: 0 };
  }

  let success = 0;
  let failed = 0;

  for (const file of files) {
    if (file.id) {
      try {
        const { data: fileData, error: downloadError } = await supabase.storage
          .from(bucketName)
          .download(file.name);

        if (downloadError) {
          console.error(`  ❌ Download failed: ${file.name}`, downloadError);
          failed++;
          continue;
        }

        const ext = file.name.split(".").pop() || "jpg";
        const contentType = `image/${ext === "jpg" ? "jpeg" : ext}`;
        const r2Key = `${bucketName}/${file.name}`;

        const command = new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: r2Key,
          Body: fileData,
          ContentType: contentType,
          Metadata: {
            "original-name": file.name,
            "migrated-from": "supabase"
          }
        });

        await s3.send(command);
        console.log(`  ✅ ${file.name} → ${r2Key}`);
        success++;
      } catch (err) {
        console.error(`  ❌ Migration failed: ${file.name}`, err.message);
        failed++;
      }
    }
  }

  return { total: files.length, success, failed };
}

async function main() {
  console.log("🚀 Starting migration from Supabase Storage to Cloudflare R2\n");

  const results = {};

  for (const bucket of BUCKETS) {
    results[bucket] = await migrateBucket(bucket);
  }

  console.log("\n📊 Migration Summary:");
  console.log("====================");

  let totalSuccess = 0;
  let totalFailed = 0;

  for (const [bucket, result] of Object.entries(results)) {
    console.log(`${bucket}: ${result.success}/${result.total} migrated (${result.failed} failed)`);
    totalSuccess += result.success;
    totalFailed += result.failed;
  }

  console.log("====================");
  console.log(`Total: ${totalSuccess} migrated, ${totalFailed} failed`);

  if (totalFailed > 0) {
    console.log("\n⚠️  Some files failed to migrate. Check the logs above.");
  } else {
    console.log("\n✅ Migration completed successfully!");
  }
}

main().catch(console.error);