import { createClient } from "@supabase/supabase-js";

// Supabase client with service role
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { form_serial_number } = req.query;
  if (!form_serial_number) return res.status(400).json({ error: "Missing serial number" });

  // Fetch participant + payment info
  const { data, error } = await supabase
    .from("quiz_applications")
    .select(`
      name,
      team_name,
      email,
      form_serial_number,
      payments (
        payment_id,
        amount,
        currency,
        status,
        method
      )
    `)
    .eq("form_serial_number", form_serial_number)
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.status(200).json(data);
}
