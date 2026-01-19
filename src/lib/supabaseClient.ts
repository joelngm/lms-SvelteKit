import { createClient } from '@supabase/supabase-js';

// Make sure these match the Vercel env variables
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
