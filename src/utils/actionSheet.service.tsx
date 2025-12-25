/**
 * Action Sheet Service
 * 
 * Provides iOS-style action sheets for user choices.
 * Uses @expo/react-native-action-sheet for native-feeling action sheets.
 */

import { useActionSheet } from '@expo/react-native-action-sheet';

export interface ActionSheetOption {
  label: string;
  onPress: () => void;
  destructive?: boolean; // Shows in red (iOS style)
  disabled?: boolean;
}

/**
 * Hook to use action sheet
 * 
 * Usage:
 * ```tsx
 * const { showActionSheet } = useActionSheetService();
 * 
 * showActionSheet({
 *   title: 'Choose an option',
 *   options: [
 *     { label: 'Option 1', onPress: () => {} },
 *     { label: 'Delete', onPress: () => {}, destructive: true },
 *   ],
 *   cancelButtonIndex: 2,
 * });
 * ```
 */
export function useActionSheetService() {
  const { showActionSheetWithOptions } = useActionSheet();

  const showActionSheet = (config: {
    title?: string;
    message?: string;
    options: ActionSheetOption[];
    cancelButtonIndex?: number;
  }) => {
    const {
      title,
      message,
      options,
      cancelButtonIndex = options.length, // Default: last option is cancel
    } = config;

    // Extract labels and handlers
    const optionLabels = options.map(opt => opt.label);
    const optionHandlers = options.map(opt => opt.onPress);
    const destructiveButtonIndices = options
      .map((opt, index) => opt.destructive ? index : null)
      .filter((index): index is number => index !== null);

    // Add cancel option
    optionLabels.push('Cancel');
    optionHandlers.push(() => {}); // Cancel does nothing

    showActionSheetWithOptions(
      {
        title,
        message,
        options: optionLabels,
        cancelButtonIndex,
        destructiveButtonIndices,
        useModal: true, // Use modal on iOS for better UX
      },
      (buttonIndex) => {
        if (buttonIndex !== undefined && buttonIndex < optionHandlers.length) {
          optionHandlers[buttonIndex]();
        }
      }
    );
  };

  return { showActionSheet };
}

