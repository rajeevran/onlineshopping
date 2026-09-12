import { connectToDatabase } from "../../../lib/mongodb";
import RecentlyViewed from "../../../models/RecentlyViewed";
import mongoose from "mongoose";

function cleanPayload(body) {
  const source = body && typeof body === "object" ? body : {};
  const data = { ...source };

  // The admin image picker sends selected product IDs as an array for
  // multi-image modules and a single ID for single-image modules.
  if (Array.isArray(data.productId)) {
    data.productId = data.productId.map(String).map(v => v.trim()).filter(Boolean);
  } else if (typeof data.productId === "string") {
    data.productId = data.productId.trim();
    if (!data.productId) delete data.productId;
  }

  // Optional user IDs must not be sent as an empty string to Mongoose.
  // An empty string cannot be cast to ObjectId and was causing PUT 500s.
  if (data.userId === "" || data.userId === null || data.userId === undefined) {
    delete data.userId;
  } else if (typeof data.userId === "string") {
    data.userId = data.userId.trim();
    if (!data.userId) delete data.userId;
  }

  if (Array.isArray(data.images)) data.images = data.images.map(String).map(v => v.trim()).filter(Boolean);
  else if (data.images === undefined || data.images === null) data.images = [];

  if (data.active !== undefined) data.active = data.active === true || String(data.active) === "true";
  if (data.rating !== undefined && data.rating !== "") data.rating = Number(data.rating);

  delete data._id;
  delete data.autoId;
  delete data.createdAt;
  delete data.__v;
  delete data.selectedImages;

  return data;
}

function validateIds(data) {
  const ids = Array.isArray(data.productId) ? data.productId : (data.productId ? [data.productId] : []);
  for (const id of ids) {
    if (!mongoose.Types.ObjectId.isValid(id)) return `Invalid product ID: ${id}`;
  }
  if (data.userId && !mongoose.Types.ObjectId.isValid(data.userId)) return `Invalid user ID: ${data.userId}`;
  return null;
}

export default async function handler(req, res) {
  try {
    await connectToDatabase();
    const { id } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid item ID" });

    if (req.method === "GET") {
    const query = RecentlyViewed.findById(id)
      .populate("userId", "name email")
      .populate("productId", "name price images");
      const item = await query;
      if (!item) return res.status(404).json({ message: "Item not found" });
      return res.status(200).json(item);
    }

    if (req.method === "PUT") {
      const data = cleanPayload(req.body);
      const validationError = validateIds(data);
      if (validationError) return res.status(400).json({ message: validationError });

      const updated = await RecentlyViewed.findByIdAndUpdate(id, data, { new: true, runValidators: true });
      if (!updated) return res.status(404).json({ message: "Item not found" });

      const item = await RecentlyViewed.findById(updated._id)
        .populate("userId", "name email")
        .populate("productId", "name price images");
      return res.status(200).json(item);
    }

    if (req.method === "DELETE") {
      const item = await RecentlyViewed.findByIdAndDelete(id);
      if (!item) return res.status(404).json({ message: "Item not found" });
      return res.status(200).json({ message: "Item deleted" });
    }

    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error("[recentlyViewed API]", error);
    return res.status(500).json({ message: error?.message || "Internal server error" });
  }
}
