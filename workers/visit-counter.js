const COUNT_INTERVAL_MS = 10 * 60 * 1000;
const ALLOWED_ORIGINS = new Set([
    'https://nahidanahida.github.io',
    'http://localhost:8000',
    'http://127.0.0.1:8000'
]);

const jsonResponse = (request, data, status = 200) => {
    const origin = request.headers.get('Origin') || '';
    const headers = {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (ALLOWED_ORIGINS.has(origin)) {
        headers['Access-Control-Allow-Origin'] = origin;
        headers.Vary = 'Origin';
    }

    return new Response(JSON.stringify(data), { status, headers });
};

const normalizeSiteId = (siteId) => (siteId || 'default').replace(/[^a-zA-Z0-9._-]/g, '_');
const counterKey = (siteId) => `counter:${normalizeSiteId(siteId)}`;
const visitorKey = (siteId, visitorId) => `visitor:${normalizeSiteId(siteId)}:${visitorId}`;

export default {
    async fetch(request, env) {
        if (request.method === 'OPTIONS') {
            return jsonResponse(request, {});
        }

        if (!env.VISIT_COUNTER) {
            return jsonResponse(request, { error: 'Missing VISIT_COUNTER KV binding' }, 500);
        }

        const url = new URL(request.url);

        if (request.method === 'GET') {
            const siteId = url.searchParams.get('siteId');
            const pageViews = Number(await env.VISIT_COUNTER.get(counterKey(siteId)) || 0);
            return jsonResponse(request, { pageViews });
        }

        if (request.method !== 'POST') {
            return jsonResponse(request, { error: 'Method not allowed' }, 405);
        }

        let body = {};
        try {
            body = await request.json();
        } catch (err) {
            return jsonResponse(request, { error: 'Invalid JSON body' }, 400);
        }

        const siteId = body.siteId;
        const visitorId = String(body.visitorId || '').replace(/[^a-zA-Z0-9._-]/g, '_');
        if (!visitorId) {
            return jsonResponse(request, { error: 'Missing visitorId' }, 400);
        }

        const now = Date.now();
        const visitorStorageKey = visitorKey(siteId, visitorId);
        const lastCountedAt = Number(await env.VISIT_COUNTER.get(visitorStorageKey) || 0);
        let pageViews = Number(await env.VISIT_COUNTER.get(counterKey(siteId)) || 0);
        let counted = false;

        if (now - lastCountedAt > COUNT_INTERVAL_MS) {
            pageViews += 1;
            counted = true;
            await env.VISIT_COUNTER.put(counterKey(siteId), String(pageViews));
            await env.VISIT_COUNTER.put(visitorStorageKey, String(now), {
                expirationTtl: Math.ceil(COUNT_INTERVAL_MS / 1000) * 2
            });
        }

        return jsonResponse(request, { pageViews, counted });
    }
};
