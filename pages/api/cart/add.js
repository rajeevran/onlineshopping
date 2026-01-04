import Cart from "../../../models/Cart";
import Product from "../../../models/Product";
import jwt from "jsonwebtoken";
import { connectToDatabase } from "../../../lib/mongodb";

export default async function handler(req, res) {
    
  if (req.method !== "POST") return res.status(405).end();

  await connectToDatabase();

  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, '$secret123#');
    const userId = decoded.id;

    const { productId, quantity, size } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
      cart.items[itemIndex].size = size;
    } else {
      cart.items.push({
        product: productId,
        quantity,
        size,
        price: product.price
      });
    }

    cart.totalAmount = cart.items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );

    cart.totalQuantity = cart.items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );    

    await cart.save();

    res.status(200).json({ message: "Item added to cart", cart });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
