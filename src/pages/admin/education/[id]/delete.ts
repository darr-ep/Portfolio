import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';

export const POST: APIRoute = async ({ params, redirect }) => {
  await supabase.from('education').delete().eq('id', params.id!);
  return redirect('/admin/education');
};
