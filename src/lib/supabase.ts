import { createClient } from '@supabase/supabase-js';
import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import type { AstroCookies } from 'astro';

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY as string;

// Server-side client — uses service role key, bypasses RLS, NEVER exposed to browser
export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Public client — uses anon key, respects RLS, safe for client-side reads
export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey);

// Auth client — uses anon key with cookie-based session management for SSR
export function createAuthClient(request: Request, cookies: AstroCookies) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get('Cookie') ?? '');
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookies.set(name, value, options)
        );
      },
    },
  });
}
