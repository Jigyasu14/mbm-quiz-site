import Razorpay from "razorpay";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { form_serial_number } = req.body;

  const razorpay = new Razorpay({
    key_id: process.env.RZP_KEY_ID,
    key_secret: process.env.RZP_KEY_SECRET
  });

  try {
    const order = await razorpay.orders.create({
      amount: 30000,           // ₹300 in paise
      currency: "INR",
      receipt: `receipt_${form_serial_number}_${Date.now()}`
    });

    res.status(200).json({ order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
