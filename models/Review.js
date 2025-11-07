
import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema({
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", require:true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});
export default mongoose.models.Review || mongoose.model("Review", ReviewSchema);
