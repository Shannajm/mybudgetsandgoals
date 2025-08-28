import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc, increment } from 'firebase/firestore';

export class TransactionServiceUpdate {
  async update(id: string, data: any): Promise<any> {
    try {
      const originalTxnRef = doc(db, 'transactions', id);
      const originalTxnSnap = await getDoc(originalTxnRef);
      
      if (!originalTxnSnap.exists()) {
        throw new Error('Transaction not found');
      }
      
      const originalTxn = originalTxnSnap.data();
      
      const updateData = {
        ...(data.description !== undefined && { description: data.description }),
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.date !== undefined && { date: data.date }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.accountId !== undefined && { accountId: data.accountId }),
        updated_at: new Date().toISOString()
      };
      
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      await updateDoc(originalTxnRef, updateData);
      
      if ((data.amount !== undefined || data.type !== undefined) && originalTxn.accountId) {
        const originalBalanceChange = originalTxn.type === 'income' ? originalTxn.amount : -Math.abs(originalTxn.amount);
        await this.updateAccountBalanceAtomic(originalTxn.accountId, -originalBalanceChange);
        
        const newAmount = data.amount !== undefined ? data.amount : originalTxn.amount;
        const newType = data.type !== undefined ? data.type : originalTxn.type;
        const newBalanceChange = newType === 'income' ? newAmount : -Math.abs(newAmount);
        await this.updateAccountBalanceAtomic(originalTxn.accountId, newBalanceChange);
      }
      
      return { id, ...data };
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }

  private async updateAccountBalanceAtomic(accountId: string, amount: number): Promise<void> {
    try {
      const accountRef = doc(db, 'accounts', accountId);
      const accountSnap = await getDoc(accountRef);
      
      if (!accountSnap.exists()) {
        throw new Error('Account not found');
      }
      
      const account = accountSnap.data();
      
      if (account.type === 'credit') {
        await updateDoc(accountRef, {
          balance: increment(amount),
          availableCredit: increment(-amount)
        });
      } else {
        await updateDoc(accountRef, {
          balance: increment(amount)
        });
      }
    } catch (error) {
      console.error('Error updating account balance:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const txnRef = doc(db, 'transactions', id);
      const txnSnap = await getDoc(txnRef);
      
      if (!txnSnap.exists()) {
        throw new Error('Transaction not found');
      }
      
      const txn = txnSnap.data();
      
      if (txn.accountId) {
        const balanceChange = txn.type === 'income' ? txn.amount : -Math.abs(txn.amount);
        await this.updateAccountBalanceAtomic(txn.accountId, -balanceChange);
      }
      
      await updateDoc(txnRef, { deleted: true });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  }
}