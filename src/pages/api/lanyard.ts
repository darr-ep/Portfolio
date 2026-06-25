import type { APIRoute } from 'astro';

const DISCORD_USER_ID = '683077987020832778';
const CACHE_TTL = 30_000;

let cache: { data: unknown; ts: number } | null = null;

export const GET: APIRoute = async () => {
  const now = Date.now();

  if (cache && now - cache.ts < CACHE_TTL) {
    return new Response(JSON.stringify(cache.data), {
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
    });
  }

  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`);
    const json = await res.json();
    cache = { data: json, ts: now };
    return new Response(JSON.stringify(json), {
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
    });
  } catch {
    return new Response(JSON.stringify({ success: false }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
