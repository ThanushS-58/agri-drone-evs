import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db, OperationType, reportFirestoreError } from '../services/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'signin' | 'signup';
  openAuthModal: (mode?: 'signin' | 'signup') => void;
  closeAuthModal: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  isAuthModalOpen: false,
  authModalMode: 'signin',
  openAuthModal: () => {},
  closeAuthModal: () => {},
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  signOutUser: async () => {},
});

const saveUserProfile = async (currentUser: User): Promise<void> => {
  const userDocRef = doc(db, 'users', currentUser.uid);
  const now = new Date().toISOString();
  await setDoc(userDocRef, {
    uid: currentUser.uid,
    email: currentUser.email,
    displayName: currentUser.displayName || 'Surveyor User',
    photoURL: currentUser.photoURL || '',
    role: currentUser.email === 'thnkks9@gmail.com' ? 'admin' : 'surveyor',
    createdAt: currentUser.metadata.creationTime || now,
    updatedAt: now,
  }, { merge: true });
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          await saveUserProfile(currentUser);
        } catch (err) {
          console.error('Error syncing user profile to Firestore:', reportFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`));
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const openAuthModal = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setIsAuthModalOpen(false);
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      throw err;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      setIsAuthModalOpen(false);
    } catch (err: any) {
      console.error('Email sign-in failed:', err);
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (cred.user && name.trim()) {
        await updateProfile(cred.user, { displayName: name });
        await saveUserProfile(cred.user);
      } else if (cred.user) {
        await saveUserProfile(cred.user);
      }
      setIsAuthModalOpen(false);
    } catch (err: any) {
      console.error('Email registration failed:', err);
      throw err;
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign-out failed:', err);
    }
  };

  const isAdmin = Boolean(user && (user.email === 'thnkks9@gmail.com' || (user.email && user.email.includes('admin'))));

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
