import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { savingsPlanService, SavingsPlan } from '@/services/SavingsPlanService';
import SavingsPlanCard from '@/components/SavingsPlanCard';
import SavingsPlanModal from '@/components/modals/SavingsPlanModal';
import ContributePlanModal from '@/components/modals/ContributePlanModal';

const Savings: React.FC = () => {
  const [plans, setPlans] = useState<SavingsPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SavingsPlan | undefined>();
  const [showEdit, setShowEdit] = useState(false);
  const [contribPlan, setContribPlan] = useState<SavingsPlan | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const list = await savingsPlanService.getAll();
      setPlans(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Fixed Savings</h1>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => { setEditing(undefined); setShowEdit(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Fixed Savings
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map(p => (
            <SavingsPlanCard
              key={p.id}
              plan={p}
              onContribute={(pl) => setContribPlan(pl)}
              onEdit={(pl) => { setEditing(pl); setShowEdit(true); }}
            />
          ))}
        </div>
      )}

      <SavingsPlanModal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        plan={editing}
        onSaved={() => load()}
      />

      <ContributePlanModal
        open={!!contribPlan}
        onOpenChange={(v) => !v && setContribPlan(null)}
        plan={contribPlan}
        onDone={() => load()}
      />
    </div>
  );
};

export default Savings;
