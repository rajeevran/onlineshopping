
import { connectToDatabase } from "../../../lib/mongodb";
import Cart from "../../../models/Cart";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  await connectToDatabase();


  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, '$secret123#');

    const { productId, quantity } = req.body;

    const cart = await Cart.findOne({ user: decoded.id });
    const item = cart.items.find(i => i.product.toString() === productId);

     if (!item){
      return res.status(404).json({ message: "Item not found in cart" });
     }

    item.quantity -= quantity;

    if (item.quantity <= 0) {
      cart.items = cart.items.filter(i => i.product.toString() !== productId);
    }
    // cart.items = cart.items.filter(
    //   (item) => item.product.toString() !== productId
    // );

    cart.totalAmount = cart.items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );
    cart.totalQuantity = cart.items.reduce(
      (sum, item) => sum + item.quantity,
      0
    ) ;
    await cart.save();

    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
