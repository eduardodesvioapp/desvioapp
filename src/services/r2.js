const WORKER_URL = import.meta.env.VITE_R2_WORKER_URL || "https://desvio-r2-worker.your-subdomain.workers.dev";
const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL || "https://storage.desvio.app";
const CF_ZONE = import.meta.env.VITE_CF_ZONE || "desvio.app";

export const R2Folders = {
  AVATARS: "avatars",
  MEDIA: "media",
  VERIFICATION: "verification"
};

export async function getPresignedUploadUrl({ filename, contentType, folder, userId }) {
  const response = await fetch(`${WORKER_URL}/api/r2/presigned-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename, contentType, folder, userId })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get upload URL");
  }

  return response.json();
}

export async function uploadToR2(file, { folder, userId, onProgress }) {
  const { uploadUrl, key, publicUrl } = await getPresignedUploadUrl({
    filename: file.name,
    contentType: file.type,
    folder,
    userId
  });

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ key, url: publicUrl });
      } else {
        reject(new Error("Upload failed"));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Upload failed")));

    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.send(file);
  });
}

export function getImageUrl(key, options = {}) {
  const {
    width,
    height,
    fit = "cover",
    quality = 85,
    format = "auto"
  } = options;

  const params = [];
  if (width) params.push(`width=${width}`);
  if (height) params.push(`height=${height}`);
  if (fit) params.push(`fit=${fit}`);
  if (quality) params.push(`quality=${quality}`);
  if (format) params.push(`format=${format}`);

  if (params.length === 0) {
    return `${R2_PUBLIC_URL}/${key}`;
  }

  return `https://${CF_ZONE}/cdn-cgi/image/${params.join(",")}/${R2_PUBLIC_URL}/${key}`;
}

export function getThumbnailUrl(key, size = 200) {
  return getImageUrl(key, { width: size, height: size, fit: "cover" });
}

export function getAvatarUrl(key, size = 400) {
  return getImageUrl(key, { width: size, height: size, fit: "cover" });
}

export function getGalleryUrl(key, width = 800) {
  return getImageUrl(key, { width, fit: "contain" });
}

export function deleteFromR2() {
  console.warn("Delete requires server-side implementation");
  return Promise.resolve();
}