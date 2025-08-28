export interface Category {
  id: number;
  name: string;
  type: 'expense' | 'income';
  color: string;
}

class CategoryService {
  private categories: Category[] = [
    { id: 1, name: 'Food & Dining', type: 'expense', color: 'orange' },
    { id: 2, name: 'Transportation', type: 'expense', color: 'yellow' },
    { id: 3, name: 'Utilities', type: 'expense', color: 'blue' },
    { id: 4, name: 'Entertainment', type: 'expense', color: 'purple' },
    { id: 5, name: 'Shopping', type: 'expense', color: 'pink' },
    { id: 6, name: 'Healthcare', type: 'expense', color: 'red' },
    { id: 7, name: 'Housing', type: 'expense', color: 'indigo' },
    { id: 8, name: 'Insurance', type: 'expense', color: 'gray' },
    { id: 9, name: 'Other', type: 'expense', color: 'slate' },
    { id: 10, name: 'Salary', type: 'income', color: 'green' },
    { id: 11, name: 'Freelance', type: 'income', color: 'emerald' },
    { id: 12, name: 'Investment', type: 'income', color: 'teal' },
    { id: 13, name: 'Other', type: 'income', color: 'slate' },
    { id: 14, name: 'Transfer', type: 'expense', color: 'slate' }
  ];

  async getAll(): Promise<Category[]> {
    return this.categories;
  }

  async getByType(type: 'expense' | 'income'): Promise<Category[]> {
    return this.categories.filter(cat => cat.type === type);
  }
}

export const categoryService = new CategoryService();