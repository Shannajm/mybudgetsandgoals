import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Category, categoryService } from '@/services/CategoryService';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType: 'expense' | 'income';
  onCreated: (category: Category) => void;
};

export default function AddCategoryDialog({ open, onOpenChange, defaultType, onCreated }: Props) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const reset = () => {
    setName('');
    setError('');
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      const created = await categoryService.create(name, defaultType);
      onCreated(created);
      reset();
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create category';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Category</DialogTitle>
          <DialogDescription>
            Create a new {defaultType} category. It will be saved to your account.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="category-name">Name</Label>
          <Input
            id="category-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Subscriptions"
            autoFocus
          />
          {error && (
            <div className="text-sm text-red-600" role="alert">{error}</div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading || !name.trim()}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


