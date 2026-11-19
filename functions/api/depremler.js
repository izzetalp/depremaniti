function resolveCors(request) {
  const rawOrigin = request.headers.get("Origin") || request.headers.get("Referer") || "";

  if (!rawOrigin) {
    return { isAllowed: true, corsOrigin: "*" };
  }

  try {
    const parsedUrl = new URL(rawOrigin);
    const hostname = parsedUrl.hostname.toLowerCase();

    const isDevelopment = hostname === "localhost" || hostname === "127.0.0.1";
    const isPreview = hostname.endsWith(".pages.dev");
    const isProduction = hostname === "depremaniti.com" || hostname.endsWith(".depremaniti.com");

    return {
      isAllowed: isDevelopment || isPreview || isProduction,
      corsOrigin: parsedUrl.origin
    };
  } catch {
    return { isAllowed: false, corsOrigin: "*" };
  }
}

function forbiddenResponse() {
  return new Response(JSON.stringify({ error: "Forbidden - Erişim Reddedildi. API sadece yetkili domainler üzerinden çalışır." }), {
    status: 403,
    headers: { "Content-Type": "application/json" }
  });
}

export async function onRequestOptions({ request }) {
  const { isAllowed, corsOrigin } = resolveCors(request);
  if (!isAllowed) {
    return forbiddenResponse();
  }

  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": corsOrigin,
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Max-Age": "86400"
    }
  });
}

export async function onRequestGet({ request, waitUntil }) {
  const { isAllowed, corsOrigin } = resolveCors(request);
  if (!isAllowed) {
    return forbiddenResponse();
  }

  const bugun = new Date();
  bugun.setSeconds(0, 0);

  const cacheKeyUrl = `https://depremaniti.com/cache/api/depremler?time=${bugun.getTime()}`;
  const cacheKey = new Request(cacheKeyUrl);
  const cache = caches.default;

  const cachedResponse = await cache.match(cacheKey);
  if (cachedResponse) {
    const response = new Response(cachedResponse.body, cachedResponse);
    response.headers.set("Access-Control-Allow-Origin", corsOrigin);
    response.headers.set("X-Worker-Cache", "HIT");
    return response;
  }

  const dun = new Date(bugun);
  dun.setDate(dun.getDate() - 7);

  const start = dun.toISOString().split(".")[0];
  const end = bugun.toISOString().split(".")[0];

  const apiUrl = `https://deprem.afad.gov.tr/apiv2/event/filter?start=${start}&end=${end}&limit=2000&orderby=timedesc`;

  try {
    const afadResponse = await fetch(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        Accept: "application/json",
      }
    });

    if (!afadResponse.ok) {
      throw new Error(`AFAD reddetti: ${afadResponse.status}`);
    }

    let data = await afadResponse.json();
    if (!Array.isArray(data)) data = [];

    const optimizedData = data.map(eq => ({
      id: eq.eventID,
      location: eq.location,
      date: eq.date,
      magnitude: eq.magnitude,
      depth: eq.depth,
      latitude: eq.latitude,
      longitude: eq.longitude
    }));

    optimizedData.sort((a, b) => b.date.localeCompare(a.date));

    const finalResponse = new Response(JSON.stringify(optimizedData), {
      status: 200,
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        "Access-Control-Allow-Origin": corsOrigin,
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Cache-Control": "public, max-age=60",
        "X-Worker-Cache": "MISS"
      },
    });

    waitUntil(cache.put(cacheKey, finalResponse.clone()));

    return finalResponse;

  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Veri çekilemedi", detay: error.message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": corsOrigin,
        },
      }
    );
  }
}
