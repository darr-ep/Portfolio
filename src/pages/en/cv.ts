import type { APIRoute } from 'astro';

export const prerender = false;

// See src/pages/cv.ts — old /en/cv links get the English PDF.
export const GET: APIRoute = ({ redirect }) => redirect('/cv.pdf?lang=en', 301);
