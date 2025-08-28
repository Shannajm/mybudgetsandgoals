import { db, auth } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  limit,
} from 'firebase/firestore';

/**
 * Delete all documents in a collection for the current user, in batches.
 * - Uses direct Firestore deletes (ignores any business rules in each service).
 * - Batch size < 500 to stay under Firestore’s limit.
 */
async function deleteUserDocsInBatches(
  collName: string,
  uid: string,
  batchSize = 300
) {
  const coll = collection(db, collName);

  // keep pulling and deleting until there are no more docs
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const q = query(coll, where('userId', '==', uid), limit(batchSize));
    const snap = await getDocs(q);
    if (snap.empty) break;

    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();

    if (snap.size < batchSize) break;
  }
}

class DataResetService {
  async resetAllData(): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Not signed in');
    const uid = user.uid;

    // Delete in a safe order: transactions first, accounts last
    const collections = [
      'transactions',
      'bills',
      'incomes',
      'goals',
      'loans',
      'accounts',
    ];

    for (const name of collections) {
      try {
        await deleteUserDocsInBatches(name, uid, 300);
        // eslint-disable-next-line no-console
        console.log(`[reset] cleared ${name}`);
      } catch (err) {
        // log and continue; we still want to clear everything else
        // eslint-disable-next-line no-console
        console.error(`[reset] failed to clear ${name}`, err);
        throw err; // surface to UI; comment this out if you prefer "best-effort" success
      }
    }
  }
}

export const dataResetService = new DataResetService();
