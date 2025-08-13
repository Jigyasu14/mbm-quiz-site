import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// Supabase client with service role
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const secret = process.env.RZP_WEBHOOK_SECRET;
  const body = req.body;
  const signature = req.headers["x-razorpay-signature"];

  // Verify Razorpay signature
  const generatedSignature = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(body))
    .digest("hex");

  if (generatedSignature !== signature) {
    return res.status(400).send("Invalid signature");
  }

  // Extract payment details
  const payment = body.payload.payment.entity;
  const { order_id, id: payment_id, amount, currency, status, email, contact } = payment;

  // You need to include form_serial_number in metadata when creating order
  const form_serial_number = payment.notes?.form_serial_number; 

  if (!form_serial_number) return res.status(400).send("Missing form_serial_number");

  // Insert into Supabase payments table
  const { error } = await supabase.from("payments").insert([
    {
      participant_serial_no: form_serial_number,
      payment_id,
      order_id,
      amount,
      currency,
      status,
      method: "UPI",   // or extract actual method if available
      email,
      contact
    }
  ]);

  if (error) return res.status(500).json({ error: error.message });

  res.status(200).send("Payment recorded");
}
