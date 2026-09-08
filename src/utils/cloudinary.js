import { v2 as cloudinary } from "cloudinary";
import { config } from "../config.js";

const enabled = Boolean(
  config.cloudinary.cloudName &&
  config.cloudinary.apiKey &&
  config.cloudinary.apiSecret
);

if (enabled) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret
  });
}

export function uploadImage(buffer) {
  if (!enabled) {
    const err = new Error("Cloudinary is not configured");
    err.statusCode = 503;
    return Promise.reject(err);
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: config.cloudinary.folder, resource_type: "image" },
      (error, result) => error ? reject(error) : resolve(result)
    );
    stream.end(buffer);
  });
}