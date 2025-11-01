import mongoose from "mongoose";

const AddressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: String,
    phone: String,
    street: String,
    city: String,
    state: String,
    pincode: String,
    isDefault: Boolean,
  },
  { timestamps: true }
);

export default mongoose.models.Address ||
  mongoose.model("Address", AddressSchema);
