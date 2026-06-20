import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.SUPABASE_URL as string;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY as string;

// Server-side client — uses service role key, bypasses RLS, NEVER exposed to browser
export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Public client — uses anon key, respects RLS, safe for client-side reads
export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey);
