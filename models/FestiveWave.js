import mongoose from "mongoose";

const FestiveWave = new mongoose.Schema({
  autoId: {
      type: Number,
      unique: true,
    },
  title: String,
  productId: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product", require:true }],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});
// ✅ Auto-increment logic
FestiveWave.pre("save", async function (next) {
  if (this.isNew) {
    const lastProduct = await mongoose
      .model("FestiveWave")
      .findOne({}, {}, { sort: { autoId: -1 } }); // get last autoId
    this.autoId = lastProduct ? lastProduct.autoId + 1 : 1;
  }
  next();
});
export default mongoose.models.FestiveWave || mongoose.model("FestiveWave", FestiveWave);
