import type { APIRoute } from 'astro';

export const prerender = false;

// The /cv page was removed: the portfolio itself is the web version of the CV,
// and the downloadable artifact is now generated at /cv.pdf. Keep old indexed
// links working.
export const GET: APIRoute = ({ redirect }) => redirect('/cv.pdf', 301);
