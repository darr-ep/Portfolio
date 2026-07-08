/// <reference types="astro/client" />
import type { User } from '@supabase/supabase-js';

// Font files inlined as base64 data URIs (Vite ?inline) for @react-pdf/renderer.
declare module '*.ttf?inline' {
  const dataUri: string;
  export default dataUri;
}

declare namespace App {
  interface Locals {
    user: User;
  }
}
