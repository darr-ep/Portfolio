import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

/**
 * POST /api/admin/reorder-projects
 *
 * Body: { ids: string[] }  — project ids in the desired display order.
 * Sets sort_order = array index for each project.
 * Returns: { success: true } | { success: false, error: string }
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json() as { ids?: unknown };
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'ids must be a non-empty array of project ids' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate all entries are strings
    if (!ids.every((id) => typeof id === 'string' && id.length > 0)) {
      return new Response(
        JSON.stringify({ success: false, error: 'All ids must be non-empty strings' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update each project's sort_order to its position in the supplied array.
    // Run in parallel — each update is independent.
    const updates = (ids as string[]).map((id, index) =>
      supabase.from('projects').update({ sort_order: index }).eq('id', id)
    );

    const results = await Promise.all(updates);

    // Surface first DB error if any
    for (const result of results) {
      if (result.error) {
        return new Response(
          JSON.stringify({ success: false, error: result.error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
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
