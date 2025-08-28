import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Calendar } from 'lucide-react';

interface StatCardProps {
  label: string;
  amount: string;
  variant: 'alert' | 'warning' | 'info' | 'normal';
}

const StatCard: React.FC<StatCardProps> = ({ label, amount, variant }) => {
  const getCardStyle = () => {
    switch (variant) {
      case 'alert':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white';
      case 'warning':
        return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white';
      case 'info':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
    }
  };

  const getIcon = () => {
    if (variant === 'alert') {
      return <AlertTriangle className="h-8 w-8 opacity-80" />;
    }
    return <Calendar className="h-8 w-8 opacity-80" />;
  };

  return (
    <Card className={getCardStyle()}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">{label}</p>
            <p className="text-2xl font-bold">{amount}</p>
          </div>
          {getIcon()}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;