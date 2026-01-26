
import { connectToDatabase } from "../../../lib/mongodb";
import Cart from "../../../models/Cart";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  await connectToDatabase();


  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, '$secret123#');
    const cart = await Cart.findOne({ user: decoded.id });
    cart.items =[];
    cart.totalAmount =0;
    cart.totalQuantity =0;
    await cart.save();

    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
