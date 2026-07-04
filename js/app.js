(function () {
  const COP_TO_VES = 4;
  const FORMAT = new Intl.NumberFormat('es', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
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

  function formatCOPInput() {
    const input = dom.copInput;
    const cursor = input.selectionStart;
    const digitsBefore = input.value.substring(0, cursor).replace(/\D/g, '').length;
    const digits = input.value.replace(/\D/g, '');

    if (digits === '') {
      input.value = '';
      return;
    }

    const formatted = Number(digits).toLocaleString('es-CO').replace(/,/g, '');
    if (formatted === input.value) return;

    input.value = formatted;

    let newCursor = 0;
    for (let i = 0, d = 0; i < formatted.length && d < digitsBefore; i++) {
      if (formatted[i] >= '0' && formatted[i] <= '9') d++;
      if (d < digitsBefore) newCursor = i + 1;
    }
    if (digitsBefore === 0) newCursor = 0;
    input.setSelectionRange(newCursor, newCursor);
  }

  function calculate() {
    const raw = dom.copInput.value.replace(/\./g, '');
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
        dom.rateDate.textContent = 'No se pudo obtener la tasa.';
      }
    } finally {
      dom.refreshBtn.classList.remove('spinning');
    }
  }

  dom.copInput.addEventListener('input', () => {
    formatCOPInput();
    calculate();
  });

  dom.refreshBtn.addEventListener('click', () => loadRates(true));

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
