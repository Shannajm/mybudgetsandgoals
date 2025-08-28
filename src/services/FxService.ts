class FxService {
  private cache = new Map<string, { rate: number; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getRate(from: string, to: string): Promise<number> {
    if (from === to) return 1;
    
    const key = `${from}-${to}`;
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.rate;
    }

    try {
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);
      const data = await response.json();
      const rate = data.rates[to];
      
      if (rate) {
        this.cache.set(key, { rate, timestamp: Date.now() });
        return rate;
      }
    } catch (error) {
      console.warn('Failed to fetch exchange rate, using fallback:', error);
    }
    
    // Fallback rates for common pairs
    const fallbackRates: Record<string, number> = {
      'USD-EUR': 0.85,
      'EUR-USD': 1.18,
      'USD-GBP': 0.73,
      'GBP-USD': 1.37,
      'USD-JPY': 110,
      'JPY-USD': 0.009,
      'USD-CAD': 1.25,
      'CAD-USD': 0.8
    };
    
    return fallbackRates[key] || 1;
  }

  formatRate(rate: number): string {
    return rate.toFixed(4);
  }

  formatExchangeDisplay(fromAmount: number, toAmount: number, rate: number, fromCurrency: string, toCurrency: string): string {
    const fromSymbol = this.getCurrencySymbol(fromCurrency);
    const toSymbol = this.getCurrencySymbol(toCurrency);
    return `${fromSymbol}${fromAmount.toFixed(2)} → ${toSymbol}${toAmount.toFixed(2)} @ ${this.formatRate(rate)}`;
  }

  private getCurrencySymbol(currency: string): string {
    const symbols: Record<string, string> = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'CAD': 'C$',
      'AUD': 'A$'
    };
    return symbols[currency] || currency;
  }
}

export const fxService = new FxService();