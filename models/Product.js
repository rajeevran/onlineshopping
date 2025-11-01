import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: String,
  description: String,
  images: { type: [String], default: [] }, // Store file URLs
  tags: { type: [String], default: [] },
  inStock: { type: Boolean, default: true },
  discountPrice: Number,
  sizes: [String],
  colors: [String],
  featured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);
