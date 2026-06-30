import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

// Updates only the alt text of an existing image — no storage file is touched,
// so the user no longer has to delete and re-upload just to fix the alt.
export const POST: APIRoute = async ({ request }) => {
  try {
    const form = await request.formData();
    const image_id = form.get('image_id') as string | null;
    const alt_es = ((form.get('alt_es') as string | null) ?? '').trim() || null;
    const alt_en = ((form.get('alt_en') as string | null) ?? '').trim() || null;

    if (!image_id) {
      return new Response('Missing image_id', { status: 400 });
    }

    const { error } = await supabase
      .from('project_images')
      .update({ alt_es, alt_en })
      .eq('id', image_id);

    if (error) {
      return new Response(error.message, { status: 500 });
    }

    // Redirect back to referer (the edit page) so the change shows immediately.
    const referer = request.headers.get('Referer') ?? '/admin/projects';
    return new Response(null, {
      status: 302,
      headers: { Location: referer },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(message, { status: 500 });
  }
};
