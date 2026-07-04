const API = {
  URL: 'https://rates.dolarvzla.com/bcv/current.json',
  CACHE_KEY: 'bcv_rates',
  INTERVAL: 5 * 60 * 1000,
  timer: null,

  async fetch() {
    const res = await fetch(this.URL, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    this._cache(data);
    return this._normalize(data);
  },

  fromCache() {
    try {
      const raw = localStorage.getItem(this.CACHE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (Date.now() - data.timestamp > 3600000) return null;
      return this._normalize(data);
    } catch {
      return null;
    }
  },

  _normalize(data) {
    const isCached = !data.current;
    return {
      eur: isCached ? data.eur : data.current.eur,
      usd: isCached ? data.usd : data.current.usd,
      date: isCached ? data.date : data.current.date,
      timestamp: data.timestamp || Date.now()
    };
  },

  _cache(data) {
    const entry = {
      eur: data.current.eur,
      usd: data.current.usd,
      date: data.current.date,
      timestamp: Date.now()
    };
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(entry));
    } catch {}
  },

  startPolling(callback) {
    this.stopPolling();
    this.timer = setInterval(async () => {
      try {
        const rates = await this.fetch();
        callback(rates);
      } catch {}
    }, this.INTERVAL);
  },

  stopPolling() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
};
