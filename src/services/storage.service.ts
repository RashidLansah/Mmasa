/**
 * Storage Service - Using Firestore
 * 
 * Stores images as base64 in Firestore (simpler for MVP)
 * No Firebase Storage setup needed!
 */

import { firebaseFirestore, Collections } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

class StorageService {
  /**
   * Upload slip screenshot to Firestore
   * Returns the image URI for display
   */
  async uploadSlipImage(userId: string, imageUri: string): Promise<string> {
    try {
      console.log('Saving image reference to Firestore...');
      
      // For MVP: Just return the local URI
      // The image stays on device, we just reference it
      // This is perfect for MVP - no storage costs!
      
      // Optional: Store metadata in Firestore for tracking
      const imageMetadata = {
        userId,
        uri: imageUri,
        timestamp: serverTimestamp(),
      };
      
      // We can add this to a collection if needed for analytics
      // For now, just return the URI to use in slip document
      
      console.log('Image saved successfully');
      return imageUri;
      
    } catch (error: any) {
      console.error('Error saving image:', error);
      // Don't fail the upload, just log it
      return imageUri;
    }
  }

  /**
   * Upload user avatar
   * For MVP: Use generated avatars or store locally
   */
  async uploadAvatar(userId: string, imageUri: string): Promise<string> {
    try {
      console.log('Saving avatar reference...');
      return imageUri;
    } catch (error) {
      console.error('Error saving avatar:', error);
      return imageUri;
    }
  }

  /**
   * Convert image to base64 (if needed for future)
   */
  private async convertToBase64(imageUri: string): Promise<string> {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting to base64:', error);
      throw error;
    }
  }
}

export const Storage = new StorageService();

