(async () => {
  const el = document.querySelector('[data-price]');
  if (!el) return;

  const usd = parseFloat(el.textContent.replace(/[^0-9.]/g, '')) || 37;

  try {
    // Detectar país del visitante
    const geo = await fetch('https://ipapi.co/json/').then(r => r.json());
    const code = geo?.country_code || 'US';

    // Mapa de monedas más comunes en LATAM
    const currencyMap = {
      CL: ['CLP', '$'],
      MX: ['MXN', '$'],
      AR: ['ARS', '$'],
      PE: ['PEN', 'S/'],
      CO: ['COP', '$'],
      EC: ['USD', '$'],
      BO: ['BOB', 'Bs.'],
      PY: ['PYG', '₲'],
      UY: ['UYU', '$'],
      DO: ['DOP', 'RD$']
    };

    const [currency, symbol] = currencyMap[code] || ['USD', '$'];

    // Convertir usando API de tasas
    const fx = await fetch(`https://api.exchangerate.host/convert?from=USD&to=${currency}`).then(r => r.json());
    const rate = fx?.result || 1;

    const local = Math.round(usd * rate).toLocaleString('es-CL');
    el.textContent = `${symbol}${local} (${currency})`;
  } catch (e) {
    console.error('Error al convertir divisa', e);
  }
})();
