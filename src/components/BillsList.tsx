import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bill } from '@/services/BillService';
import BillCard from './BillCard';

interface BillsListProps {
  bills: Bill[];
  currency: string;
  onEditBill: (bill: Bill) => void;
  onDeleteBill: (bill: Bill) => void;
  onPayBill: (bill: Bill) => void;
  getAccountName: (accountId: string) => string;
  getAccountCurrency: (accountId: string) => string;
}

const BillsList: React.FC<BillsListProps> = ({ 
  bills, 
  currency, 
  onEditBill, 
  onDeleteBill, 
  onPayBill,
  getAccountName,
  getAccountCurrency
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Bills ({currency})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {bills.map((bill) => (
            <BillCard
              key={`${bill.source}-${bill.id}`}
              bill={bill}
              onEditBill={onEditBill}
              onDeleteBill={onDeleteBill}
              onPayBill={onPayBill}
              getAccountName={getAccountName}
              getAccountCurrency={getAccountCurrency}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default BillsList;