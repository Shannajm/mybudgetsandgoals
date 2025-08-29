import { db, auth } from '@/lib/firebase';
import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

export type SavingsPlanType = 'partner' | 'fixed_deposit';
export type SavingsFrequency = 'weekly' | 'bi-weekly' | 'monthly';

export interface SavingsPlan {
  id: string;
  user_id: string;
  name: string;
  type: SavingsPlanType;
  currency: string;
  amountPerPeriod: number;
  frequency: SavingsFrequency;
  startDate: string; // ISO date (first due)
  totalPeriods: number; // e.g., 50 weeks
  paymentsMade: number; // periods contributed
  nextDueDate: string; // computed/advanced
  totalContributed?: number; // sum in plan currency
  notes?: string;
}

export interface CreateSavingsPlanData {
  name: string;
  type: SavingsPlanType;
  currency: string;
  amountPerPeriod: number;
  frequency: SavingsFrequency;
  startDate: string;
  totalPeriods: number;
  paymentsMade?: number;
  notes?: string;
}

class SavingsPlanService {
  private advance(dateStr: string, frequency: SavingsFrequency, steps: number): string {
    const d = new Date(dateStr);
    for (let i = 0; i < steps; i++) {
      if (frequency === 'weekly') d.setDate(d.getDate() + 7);
      else if (frequency === 'bi-weekly') d.setDate(d.getDate() + 14);
      else if (frequency === 'monthly') d.setMonth(d.getMonth() + 1);
    }
    return d.toISOString().split('T')[0];
  }

  async getAll(): Promise<SavingsPlan[]> {
    const user = auth.currentUser;
    if (!user) return [];
    const q = query(collection(db, 'savingsPlans'), where('userId', '==', user.uid));
    const snap = await getDocs(q);
    const rows = snap.docs.map(d => ({ id: d.id, user_id: user.uid, ...d.data() })) as any[];
    return rows.map(r => ({
      id: String(r.id),
      user_id: String(r.userId || r.user_id || ''),
      name: r.name,
      type: r.type || 'partner',
      currency: r.currency || 'USD',
      amountPerPeriod: Number(r.amountPerPeriod) || 0,
      frequency: r.frequency || 'weekly',
      startDate: r.startDate,
      totalPeriods: Number(r.totalPeriods) || 0,
      paymentsMade: Number(r.paymentsMade) || 0,
      nextDueDate: r.nextDueDate || this.advance(r.startDate, r.frequency || 'weekly', Number(r.paymentsMade) || 0),
      totalContributed: Number(r.totalContributed) || (Number(r.paymentsMade) || 0) * (Number(r.amountPerPeriod) || 0),
      notes: r.notes || ''
    }));
  }

  async getById(id: string): Promise<SavingsPlan | null> {
    const user = auth.currentUser;
    if (!user) return null;
    const ref = doc(db, 'savingsPlans', id);
    const s = await getDoc(ref);
    if (!s.exists()) return null;
    const r: any = { id: s.id, userId: user.uid, ...s.data() };
    return {
      id: r.id,
      user_id: String(r.userId || user.uid),
      name: r.name,
      type: r.type || 'partner',
      currency: r.currency || 'USD',
      amountPerPeriod: Number(r.amountPerPeriod) || 0,
      frequency: r.frequency || 'weekly',
      startDate: r.startDate,
      totalPeriods: Number(r.totalPeriods) || 0,
      paymentsMade: Number(r.paymentsMade) || 0,
      nextDueDate: r.nextDueDate || this.advance(r.startDate, r.frequency || 'weekly', Number(r.paymentsMade) || 0),
      totalContributed: Number(r.totalContributed) || (Number(r.paymentsMade) || 0) * (Number(r.amountPerPeriod) || 0),
      notes: r.notes || ''
    };
  }

  async create(data: CreateSavingsPlanData): Promise<SavingsPlan> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    const paymentsMade = data.paymentsMade ?? 0;
    const docData: any = {
      userId: user.uid,
      name: data.name,
      type: data.type,
      currency: data.currency,
      amountPerPeriod: data.amountPerPeriod,
      frequency: data.frequency,
      startDate: data.startDate,
      totalPeriods: data.totalPeriods,
      paymentsMade,
      nextDueDate: this.advance(data.startDate, data.frequency, paymentsMade),
      totalContributed: paymentsMade * data.amountPerPeriod,
      notes: data.notes || '',
      createdAt: new Date().toISOString()
    };
    const ref = await addDoc(collection(db, 'savingsPlans'), docData);
    return { id: ref.id, user_id: user.uid, ...docData } as SavingsPlan;
  }

  async update(id: string, data: Partial<CreateSavingsPlanData & { nextDueDate?: string; paymentsMade?: number; totalContributed?: number }>): Promise<SavingsPlan> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    const ref = doc(db, 'savingsPlans', id);
    const updateData: any = { ...data, updatedAt: new Date().toISOString() };
    Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);
    await updateDoc(ref, updateData);
    const after = await this.getById(id);
    if (!after) throw new Error('Failed to reload Savings Plan');
    return after;
  }

  async delete(id: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    await deleteDoc(doc(db, 'savingsPlans', id));
  }

  async applyContribution(id: string, periods: number, dateISO: string): Promise<SavingsPlan> {
    if (periods <= 0) throw new Error('Periods must be positive');
    const plan = await this.getById(id);
    if (!plan) throw new Error('Plan not found');
    const newPayments = plan.paymentsMade + periods;
    const newContributed = (plan.totalContributed || 0) + periods * plan.amountPerPeriod;
    const newNextDue = this.advance(plan.nextDueDate || plan.startDate, plan.frequency, periods);
    return this.update(id, { paymentsMade: newPayments, totalContributed: newContributed, nextDueDate: newNextDue });
  }
}

export const savingsPlanService = new SavingsPlanService();

