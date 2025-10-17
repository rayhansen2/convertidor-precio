(async () => {
  const sc = document.currentScript;
  if (!sc) return;

  // === Config ===
  const USD_BASE = Number(sc.getAttribute('data-usd') || '47');
  const cls = sc.getAttribute('data-class') || '';
  const fallbackText = sc.getAttribute('data-fallback') || 'Al hacer el pago verás el monto en tu moneda local';

  // Monedas sin decimales
  const NO_DEC = new Set(['CLP','PYG','JPY','VES']);

  // País -> [moneda, símbolo]
  const MAP = {
    AR:['ARS','$'], BO:['BOB','Bs'], BR:['BRL','R$'], CL:['CLP','$'],
    CO:['COP','$'], CR:['CRC','₡'], DO:['DOP','RD$'], EC:['USD','USD $'],
    GT:['GTQ','Q'],  HN:['HNL','L'],  MX:['MXN','$'],  NI:['NIO','C$'],
    PA:['USD','USD $'], PE:['PEN','S/'], PY:['PYG','₲'], SV:['USD','USD $'],
    UY:['UYU','$'],  ES:['EUR','€'],  US:['USD','USD $']
  };

  const fmt = (val, ccy, sym, locale='es') => {
    const n = NO_DEC.has(ccy) ? Math.round(val) : Number(val).toFixed(2);
    return `${sym}${Number(n).toLocaleString(locale)}`;
  };

  const replaceWith = (text) => {
    const span = document.createElement('span');
    if (cls) span.className = cls;
    span.textContent = text;
    sc.parentNode.replaceChild(span, sc);
  };

  // Helpers con timeout
  const withTimeout = (p, ms=1200) => Promise.race([
    p, new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')), ms))
  ]);

  // 1) GEO: varios intentos + heurística por locale
  let country = null;
  try {
    // ipapi completo
    const g1 = await withTimeout(fetch('https://ipapi.co/json/', {cache:'no-store'}).then(r=>r.json()));
    country = g1?.country_code || null;
  } catch(_){}

  if (!country) {
    try {
      // ipwho.is liviano
      const g2 = await withTimeout(fetch('https://ipwho.is/?fields=country_code', {cache:'no-store'}).then(r=>r.json()));
      country = g2?.country_code || null;
    } catch(_){}
  }

  if (!country) {
    try {
      // ipapi endpoint mínimo (solo código)
      const g3 = await withTimeout(fetch('https://ipapi.co/country/', {cache:'no-store'}).then(r=>r.text()));
      country = (g3 || '').trim().toUpperCase() || null;
    } catch(_){}
  }

  if (!country) {
    // Heurística final por locale del navegador (ej. es-CL)
    const loc = (navigator.language || '').toUpperCase();
    const guess = loc.split('-')[1]; // es-CL -> CL
    if (guess && guess.length === 2) country = guess;
  }

  if (!country) { replaceWith(fallbackText); return; }

  // 2) Moneda por país
  const cfg = MAP[country] || null;
  if (!cfg) { replaceWith(fallbackText); return; }
  const [ccy, sym] = cfg;

  // 3) Si usa USD (EC, SV, PA, US) no conviertas
  if (ccy === 'USD') { replaceWith(`${sym}${USD_BASE}`); return; }

  // 4) FX desde CDN (CSP friendly) + reintento
  let rate = null;
  try {
    const fx1 = await withTimeout(fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json', {cache:'no-store'}).then(r=>r.json()));
    rate = fx1?.usd?.[ccy.toLowerCase()] || null;
  } catch(_){}

  if (!rate) {
    try {
      // reintento con versión “pinned” (opcional)
      const fx2 = await withTimeout(fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@2025.10.17/v1/currencies/usd.json', {cache:'no-store'}).then(r=>r.json()));
      rate = fx2?.usd?.[ccy.toLowerCase()] || null;
    } catch(_){}
  }

  if (!rate) { replaceWith(fallbackText); return; }

  // 5) Pintar
  replaceWith(`${fmt(USD_BASE * rate, ccy, sym)} (${ccy})`);
})();
