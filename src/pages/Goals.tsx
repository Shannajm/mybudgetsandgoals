import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Plus, Target, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { goalService, Goal, GoalService } from '@/services/GoalService';
import GoalForm from '@/components/forms/GoalForm';
import DeleteGoalDialog from '@/components/DeleteGoalDialog';

const Goals: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>(undefined);
  const [deleteGoal, setDeleteGoal] = useState<Goal | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const data = await goalService.getAll();
      setGoals(data);
    } catch (error) {
      console.error('Error loading goals:', error);
      toast({
        title: 'Error',
        description: 'Failed to load goals. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoal = () => {
    setEditingGoal(undefined);
    setShowForm(true);
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setShowForm(true);
  };

  const handleSaveGoal = async (goal: Goal) => {
    setShowForm(false);
    setEditingGoal(undefined);
    await loadGoals();
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingGoal(undefined);
  };

  const handleDeleteGoal = async () => {
    if (!deleteGoal) return;
    
    try {
      await GoalService.deleteGoal(deleteGoal.id);
      setGoals(goals.filter(g => g.id !== deleteGoal.id));
      toast({
        title: 'Success',
        description: 'Goal deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast({
        title: 'Error',
        description: 'Could not delete goal. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeleteGoal(null);
    }
  };

  const getDaysRemaining = (targetDate: string) => {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Goals</h1>
        </div>
        <div className="text-center py-8">Loading goals...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Goals</h1>
        <Button onClick={handleAddGoal}>
          <Plus className="h-4 w-4 mr-2" />
          Add Goal
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const progress = (goal.currentSaved / goal.targetAmount) * 100;
          const daysRemaining = getDaysRemaining(goal.targetDate);
          const isCompleted = progress >= 100;
          const isOverdue = daysRemaining < 0;

          return (
            <Card key={goal.id} className={`${isCompleted ? 'border-green-500' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{goal.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Target className={`h-5 w-5 ${isCompleted ? 'text-green-500' : 'text-gray-500'}`} />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditGoal(goal)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteGoal(goal)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Saved so far</span>
                    <span className="font-medium">{formatCurrency(goal.currentSaved)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Target</span>
                    <span className="font-medium">{formatCurrency(goal.targetAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Remaining</span>
                    <span className="font-medium">
                      {formatCurrency(Math.max(0, goal.targetAmount - goal.currentSaved))}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center text-sm">
                    <span>Target Date</span>
                    <span className={`font-medium ${
                      isOverdue ? 'text-red-500' : 
                      daysRemaining <= 30 ? 'text-orange-500' : 'text-gray-600'
                    }`}>
                      {new Date(goal.targetDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {isOverdue ? 
                      `${Math.abs(daysRemaining)} days overdue` :
                      `${daysRemaining} days remaining`
                    }
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {goals.length === 0 && (
        <div className="text-center py-12">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No goals yet
          </h3>
          <p className="text-gray-500 mb-4">
            Start tracking your financial goals to stay motivated and organized.
          </p>
          <Button onClick={handleAddGoal}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Goal
          </Button>
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <GoalForm
            goal={editingGoal}
            onSave={handleSaveGoal}
            onCancel={handleCancelForm}
          />
        </DialogContent>
      </Dialog>

      <DeleteGoalDialog
        goal={deleteGoal}
        open={!!deleteGoal}
        onOpenChange={(open) => !open && setDeleteGoal(null)}
        onConfirm={handleDeleteGoal}
      />
    </div>
  );
};

export default Goals;