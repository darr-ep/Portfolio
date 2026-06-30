import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  try {
    const form = await request.formData();
    const image_id = form.get('image_id') as string | null;
    const storage_path = form.get('storage_path') as string | null;

    if (!image_id || !storage_path) {
      return new Response('Missing image_id or storage_path', { status: 400 });
    }

    await supabase.storage.from('project-images').remove([storage_path]);

    const { error } = await supabase
      .from('project_images')
      .delete()
      .eq('id', image_id);

    if (error) {
      return new Response(error.message, { status: 500 });
    }

    // Redirect back to referer (the images page)
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
