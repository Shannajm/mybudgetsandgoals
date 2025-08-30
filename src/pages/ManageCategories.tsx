import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import AddCategoryDialog from '@/components/modals/AddCategoryDialog';
import { Category, categoryService } from '@/services/CategoryService';

const COLORS: { key: string; className: string; label: string }[] = [
  { key: 'slate', className: 'bg-slate-100 text-slate-800', label: 'Slate' },
  { key: 'gray', className: 'bg-gray-100 text-gray-800', label: 'Gray' },
  { key: 'orange', className: 'bg-orange-100 text-orange-800', label: 'Orange' },
  { key: 'yellow', className: 'bg-yellow-100 text-yellow-800', label: 'Yellow' },
  { key: 'green', className: 'bg-green-100 text-green-800', label: 'Green' },
  { key: 'emerald', className: 'bg-emerald-100 text-emerald-800', label: 'Emerald' },
  { key: 'teal', className: 'bg-teal-100 text-teal-800', label: 'Teal' },
  { key: 'blue', className: 'bg-blue-100 text-blue-800', label: 'Blue' },
  { key: 'indigo', className: 'bg-indigo-100 text-indigo-800', label: 'Indigo' },
  { key: 'purple', className: 'bg-purple-100 text-purple-800', label: 'Purple' },
  { key: 'pink', className: 'bg-pink-100 text-pink-800', label: 'Pink' },
  { key: 'red', className: 'bg-red-100 text-red-800', label: 'Red' },
];

function ColorPicker({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1">
      {COLORS.map(c => (
        <button
          key={c.key}
          type="button"
          onClick={() => !disabled && onChange(c.key)}
          className={`h-6 w-6 rounded-full border ${c.className} ${value === c.key ? 'ring-2 ring-offset-2 ring-blue-500' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          title={c.label}
        />
      ))}
    </div>
  );
}

export default function ManageCategories() {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const sorted = useMemo(() => {
    return [...categories].sort((a, b) => a.name.localeCompare(b.name));
  }, [categories]);

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      const list = await categoryService.getByType(type);
      setCategories(list);
    } catch (e) {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [type]);

  const startEdit = (c: Category) => {
    setEditingId(c.id);
    setEditName(c.name);
  };

  const saveEdit = async (c: Category) => {
    try {
      await categoryService.update(c.id, { name: editName.trim() });
      setEditingId(null);
      setEditName('');
      await refresh();
    } catch (e: any) {
      setError(e?.message || 'Failed to update category');
    }
  };

  const changeColor = async (c: Category, color: string) => {
    try {
      await categoryService.update(c.id, { color });
      setCategories(prev => prev.map(p => (p.id === c.id ? { ...p, color } : p)));
    } catch (e: any) {
      setError(e?.message || 'Failed to update color');
    }
  };

  const remove = async (c: Category) => {
    if (c.id.startsWith('d')) return; // double guard
    if (!confirm(`Delete category "${c.name}"?`)) return;
    try {
      await categoryService.delete(c.id);
      setCategories(prev => prev.filter(p => p.id !== c.id));
    } catch (e: any) {
      setError(e?.message || 'Failed to delete category');
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Manage Categories</h1>
      <div className="flex items-center gap-2 mb-4">
        <Button variant={type === 'expense' ? 'default' : 'outline'} onClick={() => setType('expense')}>Expense</Button>
        <Button variant={type === 'income' ? 'default' : 'outline'} onClick={() => setType('income')}>Income</Button>
        <div className="flex-1" />
        <Button onClick={() => setAddOpen(true)}>Add Category</Button>
      </div>

      {error && <div className="mb-3 text-sm text-red-600">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle>{type === 'expense' ? 'Expense' : 'Income'} Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading…</div>
          ) : (
            <div className="space-y-3">
              {sorted.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-3">
                    <Badge className={`${COLORS.find(k => k.key === c.color)?.className || 'bg-gray-100 text-gray-800'}`}>{c.name}</Badge>
                    {c.id.startsWith('d') && (
                      <span className="text-xs text-gray-500">Default</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <ColorPicker value={c.color} onChange={(color) => changeColor(c, color)} disabled={c.id.startsWith('d')} />
                    {editingId === c.id ? (
                      <div className="flex items-center gap-2">
                        <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-48" />
                        <Button size="sm" onClick={() => saveEdit(c)}>Save</Button>
                        <Button size="sm" variant="outline" onClick={() => { setEditingId(null); setEditName(''); }}>Cancel</Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => startEdit(c)} disabled={c.id.startsWith('d')}>Rename</Button>
                        <Button size="sm" variant="destructive" onClick={() => remove(c)} disabled={c.id.startsWith('d')}>Delete</Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {sorted.length === 0 && (
                <div className="text-sm text-muted-foreground">No categories yet.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AddCategoryDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        defaultType={type}
        onCreated={(cat) => {
          setCategories((prev) => prev.some(p => p.id === cat.id) ? prev : [...prev, cat]);
        }}
      />
    </div>
  );
}

