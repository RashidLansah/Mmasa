/**
 * OCR Service - Using Node.js Server with Tesseract
 * 
 * Sends images to local Node server for OCR processing
 * Works perfectly with Expo Go!
 */

// OCR Server URL
// For Physical Device (Expo): Use your computer's local IP
// For iOS Simulator/Android Emulator: Use localhost
const OCR_SERVER_URL = 'http://192.168.1.152:3001';

// OCR is enabled for MVP
const OCR_ENABLED = true;

export interface OCRResult {
  text: string;
  confidence: number;
  success: boolean;
  error?: string;
}

class OCRService {
  /**
   * Extract text from image using Node.js server
   */
  async extractTextFromImage(imageUri: string): Promise<OCRResult> {
    if (!OCR_ENABLED) {
      return {
        text: '',
        confidence: 0,
        success: false,
        error: 'OCR disabled',
      };
    }

    try {
      console.log('═══════════════════════════════════');
      console.log('🔍 OCR EXTRACTION STARTING');
      console.log('📡 Server:', OCR_SERVER_URL);
      console.log('📸 Image URI:', imageUri.substring(0, 50) + '...');
      
      // 10 second timeout for OCR processing
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      // Create form data with image
      const formData = new FormData();
      
      // Convert image URI to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Add to form data
      formData.append('image', blob, 'slip.jpg');
      
      // Send to server with timeout
      const ocrResponse = await fetch(`${OCR_SERVER_URL}/ocr`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      console.log('📥 Server response status:', ocrResponse.status);
      
      if (!ocrResponse.ok) {
        const errorText = await ocrResponse.text();
        console.error('❌ Server error:', errorText);
        throw new Error(`Server returned ${ocrResponse.status}: ${errorText}`);
      }
      
      const result = await ocrResponse.json();
      console.log('📦 Server result:', JSON.stringify(result, null, 2));
      
      if (!result.success) {
        throw new Error(result.error || 'OCR failed');
      }
      
      console.log('✅✅✅ OCR SUCCESS! ✅✅✅');
      console.log('📄 Extracted', result.textLength, 'characters');
      console.log('🎯 Confidence:', (result.confidence * 100).toFixed(1) + '%');
      console.log('═══════════════════════════════════');
      
      return {
        text: result.text || '',
        confidence: result.confidence || 0,
        success: true,
      };
      
    } catch (error: any) {
      console.log('═══════════════════════════════════');
      console.log('❌ OCR ERROR');
      console.log('Error type:', error.name);
      console.log('Error message:', error.message);
      console.log('═══════════════════════════════════');
      
      // Provide helpful error messages
      let userFriendlyError = 'OCR server unavailable';
      
      if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
        userFriendlyError = 'Cannot connect to OCR server. Make sure server is running.';
      } else if (error.message?.includes('aborted')) {
        userFriendlyError = 'OCR timeout - image processing took too long';
      } else if (error.message?.includes('500')) {
        userFriendlyError = 'OCR server error - check server logs';
      }
      
      return {
        text: '',
        confidence: 0,
        success: false,
        error: userFriendlyError,
      };
    }
  }

  /**
   * Check if OCR server is running
   */
  async isConfigured(): Promise<boolean> {
    try {
      const response = await fetch(OCR_SERVER_URL, { method: 'GET' });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get server status
   */
  async getServerStatus(): Promise<{ running: boolean; message: string }> {
    try {
      const response = await fetch(OCR_SERVER_URL);
      const data = await response.json();
      return {
        running: true,
        message: `Server running: ${data.service} v${data.version}`
      };
    } catch (error) {
      return {
        running: false,
        message: 'Server not running. Start with: cd server && npm start'
      };
    }
  }
}

export const OCR = new OCRService();

