// ============================================================
//  Vercel Serverless Function — Proxy a Google Apps Script
//  Evita problemas de CORS llamando al GAS desde el servidor.
// ============================================================

export default async function handler(req, res) {
  // CORS headers (para uso desde el navegador)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const GAS_URL = process.env.GAS_URL;
  if (!GAS_URL) {
    return res.status(500).json({ error: 'GAS_URL no configurada en variables de entorno.' });
  }

  // Reenviar todos los query params al GAS
  const params = new URLSearchParams(req.query);
  const url    = `${GAS_URL}?${params.toString()}`;

  try {
    const gasRes = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      redirect: 'follow',
    });

    if (!gasRes.ok) {
      const text = await gasRes.text();
      return res.status(502).json({ error: 'Error en GAS', detail: text });
    }

    const data = await gasRes.json();
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Error al contactar GAS', detail: err.message });
  }
}
