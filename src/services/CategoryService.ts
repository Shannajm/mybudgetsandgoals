import { db, auth } from '@/lib/firebase';
import { addDoc, collection, getDocs, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export interface Category {
  id: string;
  name: string;
  type: 'expense' | 'income';
  color: string;
  source?: 'default' | 'custom';
}

class CategoryService {
  // Default categories remain available and get merged with user-defined ones
  private defaultCategories: Category[] = [
    { id: 'd1', name: 'Food & Dining', type: 'expense', color: 'orange', source: 'default' },
    { id: 'd2', name: 'Transportation', type: 'expense', color: 'yellow', source: 'default' },
    { id: 'd3', name: 'Utilities', type: 'expense', color: 'blue', source: 'default' },
    { id: 'd4', name: 'Entertainment', type: 'expense', color: 'purple', source: 'default' },
    { id: 'd5', name: 'Shopping', type: 'expense', color: 'pink', source: 'default' },
    { id: 'd6', name: 'Healthcare', type: 'expense', color: 'red', source: 'default' },
    { id: 'd7', name: 'Housing', type: 'expense', color: 'indigo', source: 'default' },
    { id: 'd8', name: 'Insurance', type: 'expense', color: 'gray', source: 'default' },
    { id: 'd9', name: 'Other', type: 'expense', color: 'slate', source: 'default' },
    { id: 'd10', name: 'Salary', type: 'income', color: 'green', source: 'default' },
    { id: 'd11', name: 'Freelance', type: 'income', color: 'emerald', source: 'default' },
    { id: 'd12', name: 'Investment', type: 'income', color: 'teal', source: 'default' },
    { id: 'd13', name: 'Other', type: 'income', color: 'slate', source: 'default' },
    // A special category often used for transfers/credit card payments
    { id: 'd14', name: 'Transfer', type: 'expense', color: 'slate', source: 'default' },
  ];

  private mergeUniqueByName(primary: Category[], addl: Category[]): Category[] {
    const seen = new Set(primary.map(c => c.name.toLowerCase()));
    const merged = [...primary];
    for (const c of addl) {
      if (!seen.has(c.name.toLowerCase())) {
        merged.push(c);
        seen.add(c.name.toLowerCase());
      }
    }
    return merged;
  }

  private async getUserCategories(type?: 'expense' | 'income'): Promise<Category[]> {
    const currentUser = auth.currentUser;
    if (!currentUser) return [];

    const constraints = [where('userId', '==', currentUser.uid)] as any[];
    if (type) constraints.push(where('type', '==', type));

    const q = query(collection(db, 'categories'), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({
      id: doc.id,
      name: (doc.data().name as string) || '',
      type: (doc.data().type as 'expense' | 'income') || 'expense',
      color: (doc.data().color as string) || 'slate',
      source: 'custom'
    }));
  }

  async getAll(): Promise<Category[]> {
    const customs = await this.getUserCategories();
    // Order: defaults first, then user categories (dedup by name)
    return this.mergeUniqueByName(this.defaultCategories, customs);
  }

  async getByType(type: 'expense' | 'income'): Promise<Category[]> {
    const defaults = this.defaultCategories.filter(c => c.type === type);
    const customs = await this.getUserCategories(type);
    return this.mergeUniqueByName(defaults, customs);
  }

  async create(name: string, type: 'expense' | 'income'): Promise<Category> {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated');

    const trimmed = name.trim();
    if (!trimmed) throw new Error('Category name is required');

    // Prevent duplicates by name (case-insensitive) across defaults and custom
    const existing = await this.getByType(type);
    if (existing.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      // Return the existing category instead of throwing hard
      const match = existing.find(c => c.name.toLowerCase() === trimmed.toLowerCase())!;
      return match;
    }

    const docRef = await addDoc(collection(db, 'categories'), {
      userId: currentUser.uid,
      name: trimmed,
      type,
      color: 'slate',
      created_at: new Date().toISOString()
    });

    return { id: docRef.id, name: trimmed, type, color: 'slate', source: 'custom' };
  }

  async update(id: string, updates: Partial<Pick<Category, 'name' | 'color'>>): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated');
    if (!id || id.startsWith('d')) {
      throw new Error('Default categories cannot be edited');
    }
    const payload: any = {};
    if (typeof updates.name === 'string') {
      const trimmed = updates.name.trim();
      if (!trimmed) throw new Error('Category name is required');
      payload.name = trimmed;
    }
    if (typeof updates.color === 'string') {
      payload.color = updates.color;
    }
    if (Object.keys(payload).length === 0) return;

    await updateDoc(doc(db, 'categories', id), payload);
  }

  async delete(id: string): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated');
    if (!id || id.startsWith('d')) {
      throw new Error('Default categories cannot be deleted');
    }
    await deleteDoc(doc(db, 'categories', id));
  }
}

export const categoryService = new CategoryService();
