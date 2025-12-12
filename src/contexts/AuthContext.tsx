import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { firebaseAuth } from '../services/firebase';
import { AuthService, UserProfile } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        console.log('🔐 Auth state changed - User:', firebaseUser.uid);
        
        // Fetch user profile from Firestore
        let profile = await AuthService.getUserProfile(firebaseUser.uid);
        
        // If profile doesn't exist, create it (handles old accounts or login issues)
        if (!profile) {
          console.log('⚠️  User profile not found in Firestore, creating...');
          try {
            await AuthService.createUserProfileIfMissing(
              firebaseUser.uid,
              firebaseUser.email || '',
              firebaseUser.displayName || 'User'
            );
            profile = await AuthService.getUserProfile(firebaseUser.uid);
            console.log('✅ User profile created successfully');
          } catch (error) {
            console.error('❌ Failed to create user profile:', error);
          }
        }
        
        setUserProfile(profile);
        console.log('👤 User profile loaded:', profile ? 'Success' : 'Failed');
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await AuthService.signIn(email, password);
    } catch (error: any) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      await AuthService.signUp(email, password, displayName);
    } catch (error: any) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await AuthService.signOut();
    } catch (error: any) {
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await AuthService.resetPassword(email);
    } catch (error: any) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

