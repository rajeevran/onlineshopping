import mongoose from "mongoose";

const CartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  quantity: {
    type: Number,
    default: 1
  },
  size: {
    type: String,
    default: "",
  },
  price: {
    type: Number,
    required: true // store price at add-to-cart time
  }
});

const CartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true
    },
    items: [CartItemSchema],
    totalAmount: {
      type: Number,
      default: 0
    },
    totalQuantity: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

export default mongoose.models.Cart || mongoose.model("Cart", CartSchema);
