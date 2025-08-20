import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    // 1️⃣ Fetch last serial number
    const { data: lastData, error: lastError } = await supabase
      .from("serial_numbers")
      .select("last_serial_number")
      .eq("id", 1)
      .limit(1)
      .single();

    if (lastError) throw lastError;

    let nextNumber = 1;
    if (lastData && lastData.last_serial_number != null) {
      nextNumber = lastData.last_serial_number + 1;
    }

    const formattedSerialNumber = String(nextNumber).padStart(4, "0");

    // --- GET: page load, just show serial number ---
    if (req.method === "GET") {
      return res.status(200).json({
        success: true,
        serial_number: formattedSerialNumber,
      });
    }

    // --- POST: form submit, increment in DB ---
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const {
      name,
      email,
      p1_photoBase64,
      p2_photoBase64,
      p1_signatureBase64,
      p2_signatureBase64,
    } = req.body;

    // File upload helper
    async function uploadFile(base64, folder, label) {
      if (!base64) return null;
      const buffer = Buffer.from(base64, "base64");
      const fileName = `${folder}/${formattedSerialNumber}_${label}_${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("quiz-contest-files")
        .upload(fileName, buffer, { contentType: "image/jpeg", upsert: false });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("quiz-contest-files")
        .getPublicUrl(fileName);

      return publicUrlData.publicUrl;
    }

    // Upload photos/signatures
    const p1PhotoUrl = await uploadFile(p1_photoBase64, "photos", "p1_photo");
    const p2PhotoUrl = await uploadFile(p2_photoBase64, "photos", "p2_photo");
    const p1SignatureUrl = await uploadFile(p1_signatureBase64, "signatures", "p1_signature");
    const p2SignatureUrl = await uploadFile(p2_signatureBase64, "signatures", "p2_signature");

    // Update last serial number in DB
    const { error: updateError } = await supabase
      .from("serial_numbers")
      .update({ last_serial_number: nextNumber })
      .eq("id", 1);

    if (updateError) throw updateError;

    // Save application
    const { data, error } = await supabase
      .from("quiz_applications")
      .insert([{
        name,
        email,
        form_serial_number: formattedSerialNumber,
        p1_photo_url: p1PhotoUrl,
        p2_photo_url: p2PhotoUrl,
        p1_signature_url: p1SignatureUrl,
        p2_signature_url: p2SignatureUrl,
        payment_status: "simulated_paid",
        payment_time: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      serial_number: formattedSerialNumber,
      data,
    });

  } catch (err) {
    console.error("API Error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
