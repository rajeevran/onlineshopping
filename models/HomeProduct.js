import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  autoId: {
      type: Number,
      unique: true,
    },
  title: String,
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", require:true },
  active: { type: Boolean, default: true },
  images: { type: [String], default: [] }, // Store file URLs
  createdAt: { type: Date, default: Date.now },
});
// ✅ Auto-increment logic
ProductSchema.pre("save", async function (next) {
  if (this.isNew) {
    const lastProduct = await mongoose
      .model("HomeProduct")
      .findOne({}, {}, { sort: { autoId: -1 } }); // get last autoId
    this.autoId = lastProduct ? lastProduct.autoId + 1 : 1;
  }
  next();
});
export default mongoose.models.HomeProduct || mongoose.model("HomeProduct", ProductSchema);
