import { defineMiddleware } from 'astro:middleware';
import { createAuthClient } from './lib/supabase';

const WHITELIST = ['darr.pedraz@gmail.com'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = new URL(context.request.url);

  // /api/admin/* (e.g. upload-image) is a separate prefix from /admin — startsWith('/admin')
  // never matched it, so these endpoints had no auth guard at all.
  const isAdminApi = pathname.startsWith('/api/admin/');
  const isAdminPage = pathname.startsWith('/admin');

  if (
    (!isAdminApi && !isAdminPage) ||
    pathname === '/admin/login' ||
    pathname.startsWith('/admin/auth/')
  ) {
    return next();
  }

  const supabase = createAuthClient(context.request, context.cookies);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !WHITELIST.includes(user.email ?? '')) {
    if (isAdminApi) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return context.redirect('/admin/login');
  }

  context.locals.user = user;
  return next();
});
