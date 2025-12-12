import { firebaseAuth, firebaseFirestore, Collections } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  photoURL?: string;
  createdAt: Date;
  subscriptionStatus: 'free' | 'premium';
  subscribedCreators: string[];
}

export class AuthService {
  // Sign up with email and password
  static async signUp(email: string, password: string, displayName: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      const user = userCredential.user;

      // Update profile with display name
      await updateProfile(user, { displayName });

      // Create user document in Firestore
      await setDoc(doc(firebaseFirestore, Collections.USERS, user.uid), {
        uid: user.uid,
        email: user.email,
        displayName,
        phoneNumber: null,
        photoURL: null,
        createdAt: serverTimestamp(),
        subscriptionStatus: 'free',
        subscribedCreators: [],
      });

      return user;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Sign in with email and password
  static async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      return userCredential.user;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Sign out
  static async signOut(): Promise<void> {
    try {
      await signOut(firebaseAuth);
    } catch (error: any) {
      throw new Error('Failed to sign out');
    }
  }

  // Get current user
  static getCurrentUser(): User | null {
    return firebaseAuth.currentUser;
  }

  // Get user profile from Firestore
  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(firebaseFirestore, Collections.USERS, uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  // Create user profile if missing (handles edge cases)
  static async createUserProfileIfMissing(
    uid: string,
    email: string,
    displayName: string
  ): Promise<void> {
    try {
      const docRef = doc(firebaseFirestore, Collections.USERS, uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        await setDoc(docRef, {
          uid,
          email,
          displayName,
          phoneNumber: null,
          photoURL: null,
          createdAt: serverTimestamp(),
          subscriptionStatus: 'free',
          subscribedCreators: [],
        });
        console.log('✅ User profile created for:', uid);
      }
    } catch (error) {
      console.error('❌ Error creating user profile:', error);
      throw error;
    }
  }

  // Update user profile
  static async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const docRef = doc(firebaseFirestore, Collections.USERS, uid);
      await updateDoc(docRef, updates as any);
    } catch (error) {
      throw new Error('Failed to update profile');
    }
  }

  // Reset password
  static async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(firebaseAuth, email);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Handle auth errors
  private static handleAuthError(error: any): Error {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return new Error('This email is already registered');
      case 'auth/invalid-email':
        return new Error('Invalid email address');
      case 'auth/operation-not-allowed':
        return new Error('Email/password accounts are not enabled');
      case 'auth/weak-password':
        return new Error('Password is too weak. Use at least 6 characters');
      case 'auth/user-disabled':
        return new Error('This account has been disabled');
      case 'auth/user-not-found':
        return new Error('No account found with this email');
      case 'auth/wrong-password':
        return new Error('Incorrect password');
      case 'auth/invalid-credential':
        return new Error('Invalid email or password');
      case 'auth/too-many-requests':
        return new Error('Too many attempts. Please try again later');
      default:
        return new Error(error.message || 'An error occurred during authentication');
    }
  }
}

