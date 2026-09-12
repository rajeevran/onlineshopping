import fs from "fs";
import path from "path";
import Product from "../models/Product";
import HomeProduct from "../models/HomeProduct";
import FestiveWave from "../models/FestiveWave";
import ExploreCollection from "../models/ExploreCollection";
import RecommendedProduct from "../models/RecommendedProduct";
import RecentlyViewed from "../models/RecentlyViewed";
import Review from "../models/Review";

const uploadDir = path.join(process.cwd(), "public", "uploads");

function localFilename(imagePath) {
  if (!imagePath || typeof imagePath !== "string") return null;
  // Only remove files actually managed by our /uploads endpoint.
  if (!imagePath.includes("/uploads/")) return null;
  const filename = path.basename(imagePath.split("?")[0]);
  if (!filename || filename === "." || filename === "..") return null;
  const fullPath = path.resolve(uploadDir, filename);
  if (!fullPath.startsWith(path.resolve(uploadDir) + path.sep)) return null;
  return fullPath;
}

async function getReferencedImages() {
  const docs = await Promise.all([
    Product.find({}, { images: 1 }).lean(),
    HomeProduct.find({}, { images: 1 }).lean(),
    FestiveWave.find({}, { images: 1 }).lean(),
    ExploreCollection.find({}, { images: 1 }).lean(),
    RecommendedProduct.find({}, { images: 1 }).lean(),
    RecentlyViewed.find({}, { images: 1 }).lean(),
    Review.find({}, { images: 1 }).lean(),
  ]);

  const referenced = new Set();
  for (const collection of docs) {
    for (const doc of collection) {
      for (const image of Array.isArray(doc.images) ? doc.images : []) {
        if (image) referenced.add(String(image));
      }
    }
  }
  return referenced;
}

/**
 * Delete local upload files only when no database record references them.
 * This protects product images that are reused by homepage modules/reviews.
 */
export async function cleanupUnusedImages(images = []) {
  const candidates = [...new Set((Array.isArray(images) ? images : [images]).filter(Boolean).map(String))];
  if (!candidates.length) return [];

  const referenced = await getReferencedImages();
  const removed = [];

  for (const image of candidates) {
    if (referenced.has(image)) continue;
    const fullPath = localFilename(image);
    if (!fullPath) continue;
    try {
      await fs.promises.unlink(fullPath);
      removed.push(image);
    } catch (error) {
      // ENOENT means the DB pointed at a file that is already gone; that is fine.
      if (error.code !== "ENOENT") console.warn("Unable to remove image:", error.message);
    }
  }

  return removed;
}
