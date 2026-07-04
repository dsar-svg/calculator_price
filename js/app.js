(function () {
  const COP_TO_VES = 4;
  const FORMAT = new Intl.NumberFormat('es', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const FORMAT_COP = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  const dom = {
    copInput: document.getElementById('copInput'),
    vesResult: document.getElementById('vesResult'),
    eurResult: document.getElementById('eurResult'),
    usdResult: document.getElementById('usdResult'),
    results: document.getElementById('results'),
    eurRate: document.getElementById('eurRate'),
    usdRate: document.getElementById('usdRate'),
    rateDate: document.getElementById('rateDate'),
    refreshBtn: document.getElementById('refreshRate'),
    manualToggle: document.getElementById('manualToggle'),
    manualInputs: document.getElementById('manualInputs'),
    manualEur: document.getElementById('manualEur'),
    manualUsd: document.getElementById('manualUsd'),
    applyManual: document.getElementById('applyManual'),
    themeToggle: document.getElementById('themeToggle')
  };

  let rates = { eur: null, usd: null, date: null };

  function setRates(newRates) {
    rates = newRates;
    dom.eurRate.textContent = rates.eur ? FORMAT.format(rates.eur) : '—';
    dom.usdRate.textContent = rates.usd ? FORMAT.format(rates.usd) : '—';

    if (rates.date) {
      try {
        const d = new Date(rates.date);
        dom.rateDate.textContent = 'Actualizado: ' + d.toLocaleDateString('es', {
          day: 'numeric', month: 'long', year: 'numeric'
        });
      } catch {
        dom.rateDate.textContent = 'Actualizado: ' + rates.date;
      }
    }
    calculate();
  }

  function calculate() {
    const raw = dom.copInput.value.replace(/[.,\s]/g, '');
    const cop = parseFloat(raw);
    if (isNaN(cop) || cop <= 0) {
      dom.results.hidden = true;
      return;
    }

    const ves = cop / COP_TO_VES;
    dom.vesResult.textContent = FORMAT.format(ves);

    if (rates.eur) {
      const eur = ves / rates.eur;
      dom.eurResult.textContent = FORMAT.format(eur);
    } else {
      dom.eurResult.textContent = '—';
    }

    if (rates.usd) {
      const usd = ves / rates.usd;
      dom.usdResult.textContent = FORMAT.format(usd);
    } else {
      dom.usdResult.textContent = '—';
    }

    dom.results.hidden = false;
  }

  async function loadRates(showRefresh = false) {
    if (showRefresh) {
      dom.refreshBtn.classList.add('spinning');
    }

    const cached = API.fromCache();
    if (cached && !showRefresh) {
      setRates(cached);
    }

    try {
      const fresh = await API.fetch();
      setRates(fresh);
    } catch {
      if (!cached) {
        dom.eurRate.textContent = 'Error';
        dom.usdRate.textContent = 'Error';
        dom.rateDate.textContent = 'No se pudo obtener la tasa. Ingresa manualmente.';
      }
    } finally {
      dom.refreshBtn.classList.remove('spinning');
    }
  }

  dom.copInput.addEventListener('input', calculate);

  dom.refreshBtn.addEventListener('click', () => loadRates(true));

  dom.manualToggle.addEventListener('click', () => {
    const hidden = dom.manualInputs.hidden;
    dom.manualInputs.hidden = !hidden;
    dom.manualToggle.textContent = hidden
      ? 'Ocultar ingreso manual'
      : 'Ingresar tasa manualmente';
    if (hidden && rates.eur) {
      dom.manualEur.value = rates.eur;
      dom.manualUsd.value = rates.usd;
    }
  });

  dom.applyManual.addEventListener('click', () => {
    const eur = parseFloat(dom.manualEur.value);
    const usd = parseFloat(dom.manualUsd.value);
    if (isNaN(eur) || eur <= 0) return;

    setRates({
      eur, usd: (isNaN(usd) || usd <= 0) ? eur * 0.874 : usd,
      date: 'manual',
      timestamp: Date.now()
    });
    dom.manualInputs.hidden = true;
    dom.manualToggle.textContent = 'Ingresar tasa manualmente';
  });

  dom.themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    dom.themeToggle.textContent = isLight ? '🌙' : '🌞';
    try {
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
    } catch {}
  });

  (function init() {
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'light') {
        document.body.classList.add('light-theme');
        dom.themeToggle.textContent = '🌙';
      }
    } catch {}

    loadRates();
    API.startPolling(setRates);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  })();
})();
