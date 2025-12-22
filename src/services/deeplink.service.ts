/**
 * Deep Link Service
 * 
 * Handles deep links to betting platforms
 */

import { Linking, Alert, Platform } from 'react-native';

export type BettingPlatform = 'SportyBet' | 'Bet9ja' | '1xBet' | 'Betway' | 'MozzartBet' | 'Other';

class DeepLinkService {
  /**
   * Open betting slip in platform app or web
   */
  async openSlipInPlatform(platform: BettingPlatform, bookingCode: string): Promise<void> {
    try {
      const url = this.getDeepLinkURL(platform, bookingCode);
      const canOpen = await Linking.canOpenURL(url);

      if (canOpen) {
        await Linking.openURL(url);
      } else {
        // Fallback to web
        const webUrl = this.getWebURL(platform, bookingCode);
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      console.error('Error opening deep link:', error);
      Alert.alert(
        'Error',
        `Could not open ${platform}. Please open the app manually and enter code: ${bookingCode}`
      );
    }
  }

  /**
   * Get deep link URL for platform
   */
  private getDeepLinkURL(platform: BettingPlatform, code: string): string {
    const deepLinks: Record<BettingPlatform, string> = {
      SportyBet: `sportybet://code/${code}`,
      Bet9ja: `bet9ja://code/${code}`,
      '1xBet': `onexbet://code/${code}`,
      Betway: `betway://code/${code}`,
      MozzartBet: `mozzartbet://code/${code}`,
      Other: `https://betting.com`,
    };

    return deepLinks[platform] || `https://${platform.toLowerCase()}.com`;
  }

  /**
   * Get web URL for platform
   */
  private getWebURL(platform: BettingPlatform, code: string): string {
    const webUrls: Record<BettingPlatform, string> = {
      SportyBet: `http://www.sportybet.com/gh/?shareCode=${code}`,
      Bet9ja: `https://web.bet9ja.com/share/${code}`,
      '1xBet': `https://1xbet.com/en/line/football`,
      Betway: `https://betway.com.gh/`,
      MozzartBet: `https://www.mozzartbet.com/gh/`,
      Other: `https://betting.com`,
    };

    return webUrls[platform] || `https://${platform.toLowerCase()}.com`;
  }

  /**
   * Copy booking code to clipboard
   */
  async copyBookingCode(code: string): Promise<void> {
    try {
      // In React Native, we'd use @react-native-clipboard/clipboard
      // For now, just show alert
      Alert.alert(
        'Booking Code',
        code,
        [
          {
            text: 'OK',
            style: 'default',
          },
        ]
      );
    } catch (error) {
      console.error('Error copying code:', error);
    }
  }

  /**
   * Share booking code
   */
  async shareBookingCode(platform: BettingPlatform, code: string, matches: string): Promise<void> {
    try {
      const message = `Check out this betting slip on ${platform}!\n\nBooking Code: ${code}\n\n${matches}\n\nLoad it in ${platform} app`;
      
      // In React Native, we'd use Share.share()
      console.log('Share:', message);
    } catch (error) {
      console.error('Error sharing code:', error);
    }
  }
}

export const DeepLink = new DeepLinkService();

