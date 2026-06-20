import { defineMiddleware } from 'astro:middleware';
import { createAuthClient } from './lib/supabase';

const WHITELIST = ['darr.pedraz@gmail.com'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = new URL(context.request.url);

  if (
    !pathname.startsWith('/admin') ||
    pathname === '/admin/login' ||
    pathname.startsWith('/admin/auth/')
  ) {
    return next();
  }

  const supabase = createAuthClient(context.request, context.cookies);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !WHITELIST.includes(user.email ?? '')) {
    return context.redirect('/admin/login');
  }

  context.locals.user = user;
  return next();
});
