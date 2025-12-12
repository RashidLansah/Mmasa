/**
 * Avatar Utility
 * 
 * Generates anonymous animal avatars similar to Google Docs
 * Uses DiceBear API with fun-emoji style (animals, food, etc.)
 */

export class AvatarService {
  /**
   * Generate a default avatar URL from user ID
   * Uses DiceBear's fun-emoji style for animal/fun avatars
   * 
   * @param userId - User's unique ID
   * @returns Avatar URL
   */
  static getDefaultAvatar(userId: string): string {
    // Use fun-emoji style for animal-like avatars
    // Similar to Google Docs anonymous animals
    return `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${userId}`;
  }

  /**
   * Get avatar URL, falling back to default if none provided
   * 
   * @param photoURL - User's custom photo URL (optional)
   * @param userId - User's unique ID
   * @returns Avatar URL
   */
  static getAvatar(photoURL: string | null | undefined, userId: string): string {
    return photoURL || this.getDefaultAvatar(userId);
  }

  /**
   * Alternative: Get initials-based avatar (backup option)
   * 
   * @param name - User's display name
   * @returns UI Avatars URL
   */
  static getInitialsAvatar(name: string): string {
    const encoded = encodeURIComponent(name);
    return `https://ui-avatars.com/api/?name=${encoded}&background=FF6B35&color=fff&size=200`;
  }
}

