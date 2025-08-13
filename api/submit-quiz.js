import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { name, email } = req.body;

  const { data, error } = await supabase
    .from('quiz_applications')
    .insert([{ name, email }])
    .select();

  if (error) return res.status(500).json({ success: false, error: error.message });

  res.status(200).json({ success: true, data });
}
