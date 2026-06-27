import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const ALLOWED_ORIGINS = [
  "https://desvio.app",
  "https://www.desvio.app",
  "http://localhost:5173",
  "http://localhost:3000"
];

const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif"
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function getCorsHeaders(request) {
  const origin = request.headers.get("Origin");
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400"
  };
}

function validateUploadRequest(body) {
  const errors = [];

  if (!body.filename) {
    errors.push("filename is required");
  }

  if (!body.contentType) {
    errors.push("contentType is required");
  } else if (!ALLOWED_CONTENT_TYPES.includes(body.contentType)) {
    errors.push(`contentType must be one of: ${ALLOWED_CONTENT_TYPES.join(", ")}`);
  }

  if (body.fileSize && body.fileSize > MAX_FILE_SIZE) {
    errors.push(`fileSize must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  if (body.folder && !["avatars", "media", "verification"].includes(body.folder)) {
    errors.push("folder must be one of: avatars, media, verification");
  }

  return errors;
}

function generateObjectKey(folder, userId, filename) {
  const ext = filename.split(".").pop() || "jpg";
  const randomId = crypto.randomUUID().split("-")[0];
  return `${folder}/${userId}/${randomId}.${ext}`;
}

export default {
  async fetch(request, env) {
    const corsHeaders = getCorsHeaders(request);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);

      if (url.pathname === "/api/r2/presigned-url" && request.method === "POST") {
        return this.handlePresignedUrl(request, env, corsHeaders);
      }

      if (url.pathname === "/api/r2/health") {
        return new Response(JSON.stringify({ status: "ok" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      return new Response("Not Found", { status: 404, headers: corsHeaders });

    } catch (error) {
      console.error("Worker error:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
  },

  async handlePresignedUrl(request, env, corsHeaders) {
    const body = await request.json();

    const errors = validateUploadRequest(body);
    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ error: "Validation failed", errors }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const { filename, contentType, folder = "media", userId } = body;

    const s3 = new S3Client({
      region: "auto",
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY
      }
    });

    const objectKey = generateObjectKey(folder, userId || "anonymous", filename);

    const command = new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: objectKey,
      ContentType: contentType,
      Metadata: {
        "original-filename": filename,
        "uploaded-by": userId || "anonymous"
      }
    });

    const presignedUrl = await getSignedUrl(s3, command, {
      expiresIn: 300 // 5 minutes
    });

    return new Response(
      JSON.stringify({
        uploadUrl: presignedUrl,
        key: objectKey,
        publicUrl: `${env.R2_PUBLIC_URL}/${objectKey}`
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
};