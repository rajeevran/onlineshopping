import { connectToDatabase } from "../../lib/mongodb";
import Order from "../../models/Order";

export default async function handler(req, res) {
  await connectToDatabase();

  if (req.method === "GET") {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "userId required" });
    const orders = await Order.find({ userId }).populate("products.productId").populate("addressId");
    return res.status(200).json(orders);
  } else if (req.method === "POST") {
    let { userId, products, totalAmount, addressId, paymentId } = req.body;
    if (!userId || !products || !totalAmount || !addressId) {
      return res.status(400).json({ error: "All fields required" });
    }
    console.log('pppp',products);
    
    // If products is an array of IDs, wrap them
    if (Array.isArray(products) && typeof products[0] === "string") {
      products = products.map(pid => ({ productId: pid, quantity: 1, price: Number(totalAmount) }));
    }
    console.log('pppp3',products);

    // If totalAmount is string, convert
    if (typeof totalAmount === "string") totalAmount = Number(totalAmount);
    const order = await Order.create({ userId, products, totalAmount, addressId, paymentId });
    return res.status(201).json(order);
  } else if (req.method === "PUT") {
    const { _id, orderStatus } = req.body;
    if (!_id || !orderStatus) return res.status(400).json({ error: "_id and orderStatus required" });
    const order = await Order.findByIdAndUpdate(_id, { orderStatus }, { new: true });
    return res.status(200).json(order);
  } else {
    res.setHeader("Allow", ["GET", "POST", "PUT"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
