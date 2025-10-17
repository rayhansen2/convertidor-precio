(async () => {
  const el = document.querySelector('[data-price]');
  if (!el) return;
  const usd = parseFloat(el.textContent.replace(/[^0-9.]/g, '')) || 37;

  // Detectar país
  const geo = await fetch('https://ipapi.co/json/').then(r=>r.json()).catch(()=>null);
  const code = geo?.country_code || 'US';
  const currencyMap = { CL: ['CLP','$'], MX:['MXN','$'], AR:['ARS','$'], PE:['PEN','S/'], CO:['COP','$'] };
  const [ccy, sym] = currencyMap[code] || ['USD','USD $'];

  // Convertir
  const fx = await fetch(`https://api.exchangerate.host/convert?from=USD&to=${ccy}`).then(r=>r.json()).catch(()=>null);
  const rate = fx?.result || 1;
  const local = Math.round(usd * rate).toLocaleString('es-CL');

  el.textContent = `${sym}${local} (${ccy})`;
})();
