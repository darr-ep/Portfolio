import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { supabase } from '../../../lib/supabase';

const VALID_SLOT_KEYS = ['hero', 'mockup_main', 'mockup_secondary', 'detail'] as const;
type SlotKey = typeof VALID_SLOT_KEYS[number];

export const POST: APIRoute = async ({ request }) => {
  try {
    const form = await request.formData();
    const file = form.get('file') as File | null;
    const project_id = form.get('project_id') as string | null;
    const slot_key = form.get('slot_key') as string | null;
    const alt_es = (form.get('alt_es') as string | null) ?? null;
    const alt_en = (form.get('alt_en') as string | null) ?? null;

    if (!file || !project_id || !slot_key) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: file, project_id, slot_key' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!VALID_SLOT_KEYS.includes(slot_key as SlotKey)) {
      return new Response(
        JSON.stringify({ success: false, error: `Invalid slot_key. Must be one of: ${VALID_SLOT_KEYS.join(', ')}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const arrayBuffer = await file.arrayBuffer();

    // Convert every upload to WebP server-side — project photos were coming in as multi-MB
    // PNGs, which is wasted bandwidth/decode time for a photographic image. SVGs (rare, but
    // valid for these slots) pass through untouched since they aren't raster images.
    const isSvg = file.type === 'image/svg+xml';
    const outputBuffer = isSvg
      ? Buffer.from(arrayBuffer)
      : await sharp(Buffer.from(arrayBuffer)).webp({ quality: 82 }).toBuffer();
    const ext = isSvg ? 'svg' : 'webp';
    const contentType = isSvg ? file.type : 'image/webp';

    const storagePath = `${project_id}/${slot_key}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('project-images')
      .upload(storagePath, outputBuffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      return new Response(
        JSON.stringify({ success: false, error: uploadError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data: urlData } = supabase.storage
      .from('project-images')
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    // Remove old storage file for this slot before upserting (to avoid orphaned files)
    const { data: existing } = await supabase
      .from('project_images')
      .select('storage_path')
      .eq('project_id', project_id)
      .eq('slot_key', slot_key)
      .maybeSingle();

    if (existing?.storage_path && existing.storage_path !== storagePath) {
      await supabase.storage.from('project-images').remove([existing.storage_path]);
    }

    const { data: imageRow, error: dbError } = await supabase
      .from('project_images')
      .upsert(
        { project_id, slot_key, storage_path: storagePath, url: publicUrl, alt_es, alt_en },
        { onConflict: 'project_id,slot_key' }
      )
      .select('id, url')
      .single();

    if (dbError) {
      return new Response(
        JSON.stringify({ success: false, error: dbError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, url: publicUrl, id: imageRow.id }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const { image_id, storage_path } = await request.json() as { image_id: string; storage_path: string };

    if (!image_id || !storage_path) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing image_id or storage_path' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { error: storageError } = await supabase.storage
      .from('project-images')
      .remove([storage_path]);

    if (storageError) {
      return new Response(
        JSON.stringify({ success: false, error: storageError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { error: dbError } = await supabase
      .from('project_images')
      .delete()
      .eq('id', image_id);

    if (dbError) {
      return new Response(
        JSON.stringify({ success: false, error: dbError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
