import { db, auth } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentSaved: number;
  category: string;
  targetDate: string;
  status: 'active' | 'completed' | 'paused';
  user_id: string;
  accountId?: string;
}

export interface CreateGoalData {
  name: string;
  targetAmount: number;
  currentSaved?: number;
  category: string;
  targetDate: string;
  accountId?: string;
}

export class GoalService {
  static async deleteGoal(goalId: string): Promise<void> {
    try {
      const goalRef = doc(db, "goals", goalId);
      await deleteDoc(goalRef);
    } catch (err) {
      console.error("Error deleting goal:", err);
      throw err;
    }
  }

  async getAll(): Promise<Goal[]> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return [];

      const q = query(collection(db, 'goals'), where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Goal[];
    } catch (error) {
      console.error('Error fetching goals:', error);
      return [];
    }
  }

  async getSummary(): Promise<{ totalGoals: number; completedGoals: number; overallProgress: number }> {
    const allGoals = await this.getAll();
    const totalGoals = allGoals.length;
    const completedGoals = allGoals.filter(g => g.status === 'completed').length;
    const totalTarget = allGoals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalCurrent = allGoals.reduce((sum, g) => sum + g.currentSaved, 0);
    const overallProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;
    
    return { totalGoals, completedGoals, overallProgress };
  }

  async create(data: CreateGoalData): Promise<Goal> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');
      
      const docData = {
        userId: currentUser.uid,
        name: data.name,
        targetAmount: data.targetAmount,
        currentSaved: data.currentSaved || 0,
        category: data.category,
        targetDate: data.targetDate,
        accountId: data.accountId,
        status: 'active' as const,
        createdAt: new Date().toISOString()
      };
      
      Object.keys(docData).forEach(key => {
        if (docData[key] === undefined) {
          delete docData[key];
        }
      });

      const docRef = await addDoc(collection(db, 'goals'), docData);
      return { id: docRef.id, user_id: currentUser.uid, ...docData };
    } catch (error) {
      console.error('Error creating goal:', error);
      throw error;
    }
  }

  async update(id: string, data: Partial<CreateGoalData>): Promise<Goal> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');
      
      const updateData = {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.targetAmount !== undefined && { targetAmount: data.targetAmount }),
        ...(data.currentSaved !== undefined && { currentSaved: data.currentSaved }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.targetDate !== undefined && { targetDate: data.targetDate }),
        ...(data.accountId !== undefined && { accountId: data.accountId }),
        updatedAt: new Date().toISOString()
      };
      
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      await updateDoc(doc(db, 'goals', id), updateData);
      return { id, ...data } as Goal;
    } catch (error) {
      console.error('Error updating goal:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');
      
      await deleteDoc(doc(db, 'goals', id));
    } catch (error) {
      console.error('Error deleting goal:', error);
      throw error;
    }
  }
}

export const goalService = new GoalService();