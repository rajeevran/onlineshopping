import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: { type: String, required: true, unique: true },
    passwordHash: String,
    phone: String,
    gender: String,
    dob: Date,
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
