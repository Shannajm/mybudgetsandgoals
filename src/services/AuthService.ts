import { auth, db } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  updateProfile,
  sendPasswordResetEmail,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignUpCredentials {
  email: string;
  password: string;
  fullName: string;
}

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
}

// Mock fallback for development
const STORAGE_KEY = 'finance_app_users';
const CURRENT_USER_KEY = 'finance_app_current_user';

const getStoredUsers = (): UserProfile[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [
    {
      id: 'demo-user',
      email: 'demo@example.com',
      fullName: 'Demo User',
      createdAt: new Date().toISOString()
    }
  ];
};

const saveUsers = (users: UserProfile[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }
};

const getCurrentStoredUser = (): UserProfile | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  return stored ? JSON.parse(stored) : null;
};

const setCurrentStoredUser = (user: UserProfile | null) => {
  if (typeof window !== 'undefined') {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  }
};

export const AuthService = {
  async signInWithGoogle(): Promise<{ user: User | null; error: string | null }> {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      // Popup-only (no redirect fallback) so the consent screen shows
      // the current site origin instead of the firebaseapp.com domain.
      const userCredential = await signInWithPopup(auth, provider);

      const fbUser = userCredential.user;
      // Ensure user profile exists in Firestore
      const userRef = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          fullName: fbUser.displayName || '',
          email: fbUser.email || '',
          createdAt: new Date().toISOString()
        });
      }
      return { user: fbUser, error: null };
    } catch (error: any) {
      const code = error?.code || '';
      if (typeof code === 'string' && code.includes('popup')) {
        return { user: null, error: 'Popup blocked or closed. Please allow popups for this site and try again.' };
      }
      return { user: null, error: 'Google sign-in failed. Please try again.' };
    }
  },
  async signUp(credentials: SignUpCredentials): Promise<{ user: User | null; error: string | null }> {
    try {
      // Try Firebase first
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        credentials.email, 
        credentials.password
      );
      
      await updateProfile(userCredential.user, {
        displayName: credentials.fullName
      });
      
      // Save user profile to Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        fullName: credentials.fullName,
        email: credentials.email,
        createdAt: new Date().toISOString()
      });
      
      return { user: userCredential.user, error: null };
    } catch (error: any) {
      // Fallback to localStorage
      const users = getStoredUsers();
      const existingUser = users.find(u => u.email === credentials.email);
      if (existingUser) {
        return { user: null, error: 'User already exists' };
      }

      const newUser: UserProfile = {
        id: `user-${Date.now()}`,
        email: credentials.email,
        fullName: credentials.fullName,
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      saveUsers(users);
      setCurrentStoredUser(newUser);

      const user = {
        uid: newUser.id,
        email: newUser.email,
        displayName: newUser.fullName
      } as User;

      return { user, error: null };
    }
  },

  async signIn(credentials: LoginCredentials): Promise<{ user: User | null; error: string | null }> {
    try {
      // Try Firebase first
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );
      
      return { user: userCredential.user, error: null };
    } catch (error: any) {
      // Fallback to localStorage
      const users = getStoredUsers();
      const user = users.find(u => u.email === credentials.email);
      if (!user) {
        return { user: null, error: 'Invalid email or password' };
      }

      setCurrentStoredUser(user);
      const authUser = {
        uid: user.id,
        email: user.email,
        displayName: user.fullName
      } as User;

      return { user: authUser, error: null };
    }
  },

  async signOut(): Promise<{ error: string | null }> {
    try {
      await firebaseSignOut(auth);
      setCurrentStoredUser(null);
      return { error: null };
    } catch (error) {
      setCurrentStoredUser(null);
      return { error: null };
    }
  },

  async getCurrentUser(): Promise<User | null> {
    if (auth.currentUser) {
      return auth.currentUser;
    }
    
    const currentUser = getCurrentStoredUser();
    if (currentUser) {
      return {
        uid: currentUser.id,
        email: currentUser.email,
        displayName: currentUser.fullName
      } as User;
    }
    return null;
  },

  async updateProfile(updates: { fullName?: string }): Promise<{ error: string | null }> {
    try {
      if (auth.currentUser && updates.fullName) {
        await updateProfile(auth.currentUser, {
          displayName: updates.fullName
        });
        
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          fullName: updates.fullName,
          email: auth.currentUser.email,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        
        return { error: null };
      }
      
      // Fallback to localStorage
      const currentUser = getCurrentStoredUser();
      if (!currentUser) {
        return { error: 'Not authenticated' };
      }

      const users = getStoredUsers();
      const userIndex = users.findIndex(u => u.id === currentUser.id);
      if (userIndex === -1) {
        return { error: 'User not found' };
      }

      if (updates.fullName) {
        users[userIndex].fullName = updates.fullName;
        currentUser.fullName = updates.fullName;
      }

      saveUsers(users);
      setCurrentStoredUser(currentUser);

      return { error: null };
    } catch (error) {
      return { error: 'Failed to update profile' };
    }
  },

  async resetPassword(email: string): Promise<{ error: string | null }> {
    try {
      await sendPasswordResetEmail(auth, email);
      return { error: null };
    } catch {
      return { error: 'Failed to send reset email' };
    }
  },
};
