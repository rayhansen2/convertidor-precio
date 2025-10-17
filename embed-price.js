(async () => {
  const sc = document.currentScript;
  if (!sc) return;

  // === Config desde data-* ===
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

  const fmt = (val, ccy, sym) => {
    const n = NO_DEC.has(ccy) ? Math.round(val) : Number(val).toFixed(2);
    return `${sym}${Number(n).toLocaleString('es')}`;
  };

  const replaceWith = (text) => {
    const span = document.createElement('span');
    if (cls) span.className = cls;
    span.textContent = text;
    sc.parentNode.replaceChild(span, sc);
  };

  // 1) Geo por IP (si falla → fallback)
  let country = null;
  try {
    const g = await fetch('https://ipapi.co/json/').then(r => r.json());
    country = g?.country_code || null;
  } catch (_) {}
  if (!country) { replaceWith(fallbackText); return; }

  // 2) Moneda por país (si no está mapeado → fallback)
  const cfg = MAP[country];
  if (!cfg) { replaceWith(fallbackText); return; }
  const [ccy, sym] = cfg;

  // 3) Si usa USD, no conviertas (muestra USD base)
  if (ccy === 'USD') { replaceWith(`${sym}${USD_BASE}`); return; }

  // 4) FX desde CDN (CSP friendly). Si falla → fallback
  let rate = null;
  try {
    const fx = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json', {cache:'no-store'}).then(r => r.json());
    rate = fx?.usd?.[ccy.toLowerCase()] || null;
  } catch (_) {}
  if (!rate) { replaceWith(fallbackText); return; }

  // 5) Pintar precio local
  replaceWith(`${fmt(USD_BASE * rate, ccy, sym)} (${ccy})`);
})();
