import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { SavingsPlan } from '@/services/SavingsPlanService';

interface Props {
  plan: SavingsPlan;
  onContribute: (plan: SavingsPlan) => void;
  onEdit: (plan: SavingsPlan) => void;
}

const SavingsPlanCard: React.FC<Props> = ({ plan, onContribute, onEdit }) => {
  const paidToDate = (plan.totalContributed ?? (plan.paymentsMade * plan.amountPerPeriod));
  const remainingPeriods = Math.max(0, plan.totalPeriods - plan.paymentsMade);
  const projectedTotal = plan.totalPeriods * plan.amountPerPeriod;
  const progress = Math.min(100, Math.round((plan.paymentsMade / (plan.totalPeriods || 1)) * 100));

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{plan.name}</CardTitle>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit(plan)}>Edit</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span>Weekly Payment</span>
          <span className="font-medium">{formatCurrency(plan.amountPerPeriod, plan.currency)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Payments Made</span>
          <span className="font-medium">{plan.paymentsMade} / {plan.totalPeriods}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Weeks Left</span>
          <span className="font-medium">{remainingPeriods}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Paid to Date</span>
          <span className="font-medium text-green-600">{formatCurrency(paidToDate, plan.currency)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Projected Total</span>
          <span className="font-medium">{formatCurrency(projectedTotal, plan.currency)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Next Due</span>
          <span className="font-medium">{new Date(plan.nextDueDate).toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span className="font-medium">{progress}%</span>
        </div>
        <Button className="w-full" onClick={() => onContribute(plan)}>Contribute</Button>
      </CardContent>
    </Card>
  );
};

export default SavingsPlanCard;

