import mongoose from "mongoose";

const BankAccountSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    accountHolder: String,
    bankName: String,
    accountNumber: String,
    ifsc: String,
    isDefault: Boolean,
  },
  { timestamps: true }
);

export default mongoose.models.BankAccount || mongoose.model("BankAccount", BankAccountSchema);
