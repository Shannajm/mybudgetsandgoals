import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { SavingsPlan } from '@/services/SavingsPlanService';
import InfoTip from '@/components/InfoTip';

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
          <LabelWithTip label="Payments Made" tip="Number of periods contributed so far." />
          <span className="font-medium">{plan.paymentsMade} / {plan.totalPeriods}</span>
        </div>
        <div className="flex justify-between text-sm">
          <LabelWithTip label="Weeks Left" tip="Total remaining periods to reach the goal." />
          <span className="font-medium">{remainingPeriods}</span>
        </div>
        <div className="flex justify-between text-sm">
          <LabelWithTip label="Paid to Date" tip="Sum of all contributions to date." />
          <span className="font-medium text-green-600">{formatCurrency(paidToDate, plan.currency)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <LabelWithTip label="Projected Total" tip="amount × periods over the whole plan." />
          <span className="font-medium">{formatCurrency(projectedTotal, plan.currency)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <LabelWithTip label="Next Due" tip="Next scheduled contribution date." />
          <span className="font-medium">{new Date(plan.nextDueDate).toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <LabelWithTip label="Progress" tip="Payments made divided by total periods." />
          <span className="font-medium">{progress}%</span>
        </div>
        <Button className="w-full" onClick={() => onContribute(plan)}>Contribute</Button>
      </CardContent>
    </Card>
  );
};

export default SavingsPlanCard;
  const LabelWithTip = ({ label, tip }: { label: string; tip: string }) => (
    <div className="flex items-center gap-1">
      <span>{label}</span>
      <InfoTip text={tip} />
    </div>
  );
