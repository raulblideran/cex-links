// Cloudflare Worker - CeX API CORS proxy
// Deploy at https://workers.cloudflare.com/ (free tier is plenty)
// Then put your worker URL in CORS_PROXIES in index.html

const ALLOWED_HOSTS = ["wss2.cex.uk.webuy.io", "docs.google.com"];

export default {
    async fetch(request) {
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        };

        if (request.method === "OPTIONS") {
            return new Response(null, { headers: corsHeaders });
        }

        const url = new URL(request.url);
        const target = url.searchParams.get("url");

        if (!target) {
            return new Response("Missing ?url= param", { status: 400, headers: corsHeaders });
        }

        let targetUrl;
        try {
            targetUrl = new URL(target);
        } catch {
            return new Response("Invalid URL", { status: 400, headers: corsHeaders });
        }

        if (!ALLOWED_HOSTS.includes(targetUrl.host)) {
            return new Response("Host not allowed", { status: 403, headers: corsHeaders });
        }

        const upstream = await fetch(targetUrl.toString(), {
            headers: { "User-Agent": "Mozilla/5.0" },
        });

        const body = await upstream.text();
        return new Response(body, {
            status: upstream.status,
            headers: {
                ...corsHeaders,
                "Content-Type": upstream.headers.get("Content-Type") || "application/json",
                "Cache-Control": "public, max-age=3600",
            },
        });
    },
};
