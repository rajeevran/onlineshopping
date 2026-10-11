import mongoose from "mongoose";
import "./Product";
import "./User";
import "./Address";
import "./BankAccount";

const OrderSchema = new mongoose.Schema(
  {
    orderId: { type: String, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    products: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: Number,
        price: Number,
        size: String,
      },
    ],
    totalAmount: Number,
    paymentMethod: { type: String, default: "Razorpay" },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },
    orderStatus: {
      type: String,
      enum: ["Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Processing",
    },
    addressId: { type: mongoose.Schema.Types.ObjectId, ref: "Address" },
    bankAccountId: { type: mongoose.Schema.Types.ObjectId, ref: "BankAccount" },
    paymentId: String,
    shipping: {
      carrier: { type: String, default: "Ekart" },
      awb: String,
      shipmentId: String,
      status: String,
      trackingUrl: String,
      labelUrl: String,
      lastTrackedAt: Date,
      rawCreateResponse: mongoose.Schema.Types.Mixed,
      rawTrackingResponse: mongoose.Schema.Types.Mixed,
      history: [{
        status: String,
        description: String,
        location: String,
        timestamp: Date,
        raw: mongoose.Schema.Types.Mixed,
      }],
    },
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
