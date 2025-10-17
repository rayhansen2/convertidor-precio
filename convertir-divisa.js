(async () => {
  // 1) Nodo de precio (usa el que ya tienes en la página)
  const el = document.querySelector('[data-price]');
  if (!el) return;

  // 2) Precio base en USD (intenta leerlo del texto; fallback a 37)
  const USD_BASE = parseFloat((el.textContent || '').replace(/[^0-9.]/g, '')) || 37;

  // 3) Monedas y símbolos por país
  const MAP = {
    AR: ['ARS', '$'], BO: ['BOB', 'Bs'], BR: ['BRL', 'R$'], CL: ['CLP', '$'],
    CO: ['COP', '$'], CR: ['CRC', '₡'], DO: ['DOP', 'RD$'], EC: ['USD', 'USD $'],
    GT: ['GTQ', 'Q'],  HN: ['HNL', 'L'],  MX: ['MXN', '$'],  NI: ['NIO', 'C$'],
    PA: ['USD', 'USD $'], PE: ['PEN', 'S/'], PY: ['PYG', '₲'], SV: ['USD', 'USD $'],
    UY: ['UYU', '$'],  ES: ['EUR', '€'],  US: ['USD', 'USD $']
  };

  // 4) Monedas sin decimales (redondeo entero)
  const NO_DEC = new Set(['CLP', 'PYG', 'JPY', 'VES']);

  const format = (value, ccy, symbol) => {
    const n = NO_DEC.has(ccy) ? Math.round(value) : Number(value).toFixed(2);
    return `${symbol}${Number(n).toLocaleString('es')}`;
  };

  // 5) Geo por IP
  let country = 'US';
  try {
    const g = await fetch('https://ipapi.co/json/').then(r => r.json());
    country = (g && g.country_code) ? g.country_code : 'US';
  } catch (_) {}

  const cfg = MAP[country] || ['USD', 'USD $'];
  const [ccy, symbol] = cfg;

  // Si país usa USD, no conviertas
  if (ccy === 'USD') {
    el.textContent = `${symbol}${USD_BASE}`;
    return;
  }

  // 6) Tipo de cambio desde jsDelivr (evita bloqueos CSP)
  let rate = 1;
  try {
    const fx = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json', {cache:'no-store'}).then(r => r.json());
    rate = fx && fx.usd && fx.usd[ccy.toLowerCase()] ? fx.usd[ccy.toLowerCase()] : 1;
  } catch (_) {
    rate = 1; // fallback
  }

  // 7) Pintar
  const local = USD_BASE * rate;
  el.textContent = `${format(local, ccy, symbol)} (${ccy})`;
})();
