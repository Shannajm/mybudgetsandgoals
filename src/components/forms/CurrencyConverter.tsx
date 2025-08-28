import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fxService } from '@/services/FxService';
import { formatCurrencyWithSign } from '@/lib/utils';

interface CurrencyConverterProps {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  onRateChange: (rate: number) => void;
  onConvertedAmountChange: (amount: number) => void;
}

const CurrencyConverter: React.FC<CurrencyConverterProps> = ({
  fromCurrency,
  toCurrency,
  amount,
  onRateChange,
  onConvertedAmountChange
}) => {
  const [rate, setRate] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [convertedAmount, setConvertedAmount] = useState<number>(amount);

  useEffect(() => {
    if (fromCurrency && toCurrency && fromCurrency !== toCurrency) {
      loadExchangeRate();
    } else {
      setRate(1);
      setConvertedAmount(amount);
      onRateChange(1);
      onConvertedAmountChange(amount);
    }
  }, [fromCurrency, toCurrency]);

  useEffect(() => {
    const newConvertedAmount = amount * rate;
    setConvertedAmount(newConvertedAmount);
    onConvertedAmountChange(newConvertedAmount);
  }, [amount, rate]);

  const loadExchangeRate = async () => {
    setIsLoading(true);
    try {
      const fetchedRate = await fxService.getRate(fromCurrency, toCurrency);
      setRate(fetchedRate);
      onRateChange(fetchedRate);
    } catch (error) {
      console.error('Error loading exchange rate:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRateChange = (newRate: number) => {
    setRate(newRate);
    onRateChange(newRate);
    const newConvertedAmount = amount * newRate;
    setConvertedAmount(newConvertedAmount);
    onConvertedAmountChange(newConvertedAmount);
  };

  if (fromCurrency === toCurrency) {
    return null;
  }

  return (
    <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
        Currency Conversion Required
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs text-gray-600 dark:text-gray-400">
            From ({fromCurrency})
          </Label>
          <div className="text-sm font-medium">
            {formatCurrencyWithSign(amount, fromCurrency)}
          </div>
        </div>
        
        <div>
          <Label className="text-xs text-gray-600 dark:text-gray-400">
            To ({toCurrency})
          </Label>
          <div className="text-sm font-medium">
            {formatCurrencyWithSign(convertedAmount, toCurrency)}
          </div>
        </div>
      </div>
      
      <div>
        <Label htmlFor="conversionRate" className="text-sm">
          Conversion Rate (1 {fromCurrency} = ? {toCurrency})
        </Label>
        <Input
          id="conversionRate"
          type="number"
          step="0.0001"
          value={rate}
          onChange={(e) => handleRateChange(parseFloat(e.target.value) || 1)}
          disabled={isLoading}
          className="mt-1"
        />
        {isLoading && (
          <div className="text-xs text-gray-500 mt-1">Loading live rate...</div>
        )}
      </div>
    </div>
  );
};

export default CurrencyConverter;