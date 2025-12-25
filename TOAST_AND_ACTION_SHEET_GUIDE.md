# Toast & Action Sheet Implementation Guide

## ✅ Completed

### Libraries Installed
- `react-native-toast-message` - For iOS-style toast notifications
- `@expo/react-native-action-sheet` - For iOS-style action sheets

### Files Created
- `src/utils/toast.service.ts` - Toast utility functions
- `src/utils/actionSheet.service.tsx` - Action sheet hook

### Files Updated
- `App.tsx` - Added `ActionSheetProvider` and `Toast` component
- `src/screens/home/SlipDetailsScreen.tsx` - Replaced all `Alert.alert` with toasts/action sheets
- `src/screens/home/SlipUploadScreenV2.tsx` - Replaced `Alert.alert` with toasts
- `src/screens/settings/SettingsScreen.tsx` - Replaced logout confirmation with action sheet

## 📝 Usage Patterns

### Toast Notifications

**Simple toast:**
```tsx
import { showToast, showSuccess, showError, showInfo } from '../../utils/toast.service';

// Simple message
showToast('Operation completed');

// Success
showSuccess('Slip published successfully!', 'Success');

// Error
showError('Failed to save', 'Error');

// Info
showInfo('Processing your request...', 'Info');
```

**With options:**
```tsx
showToast({
  type: 'success',
  title: 'Success',
  message: 'Your slip has been published',
  duration: 3000,
  position: 'top', // or 'bottom'
});
```

### Action Sheets

**Basic action sheet:**
```tsx
import { useActionSheetService } from '../../utils/actionSheet.service';

const { showActionSheet } = useActionSheetService();

showActionSheet({
  title: 'Choose an option',
  message: 'Select what you want to do',
  options: [
    {
      label: 'Edit',
      onPress: () => {
        // Handle edit
      },
    },
    {
      label: 'Delete',
      onPress: () => {
        // Handle delete
      },
      destructive: true, // Shows in red (iOS style)
    },
  ],
  cancelButtonIndex: 2, // Index of cancel button (usually last)
});
```

**Confirmation action sheet (like delete):**
```tsx
showActionSheet({
  title: 'Delete Slip',
  message: 'Are you sure? This action cannot be undone.',
  options: [
    {
      label: 'Delete',
      onPress: async () => {
        // Handle deletion
      },
      destructive: true,
    },
  ],
  cancelButtonIndex: 1, // Cancel is second option
});
```

## 🔄 Migration Pattern

### Before (Alert.alert):
```tsx
Alert.alert(
  'Error',
  'Something went wrong',
  [{ text: 'OK' }]
);
```

### After (Toast):
```tsx
showError('Something went wrong', 'Error');
```

### Before (Confirmation Alert):
```tsx
Alert.alert(
  'Delete',
  'Are you sure?',
  [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: handleDelete },
  ]
);
```

### After (Action Sheet):
```tsx
showActionSheet({
  title: 'Delete',
  message: 'Are you sure?',
  options: [
    {
      label: 'Delete',
      onPress: handleDelete,
      destructive: true,
    },
  ],
  cancelButtonIndex: 1,
});
```

## 📱 Remaining Screens to Update

The following screens still use `Alert.alert` and should be updated:

1. **src/screens/auth/SignUpScreen.tsx** - Replace with toasts
2. **src/screens/auth/PhoneLoginScreen.tsx** - Replace with toasts
3. **src/screens/auth/ForgotPasswordScreen.tsx** - Replace with toasts
4. **src/screens/wallet/WithdrawScreen.tsx** - Replace with toasts/action sheets
5. **src/screens/wallet/AddAccountScreen.tsx** - Replace with toasts/action sheets
6. **src/screens/settings/UpdateResultsScreen.tsx** - Replace with toasts
7. **src/services/deeplink.service.ts** - Replace with toasts

## 🎨 iOS Styling

The toast component automatically uses iOS-style animations and positioning. Action sheets use native iOS modals when `useModal: true` is set (which is the default).

## ✨ Benefits

1. **Native iOS Feel** - Action sheets slide up from bottom (iOS style)
2. **Better UX** - Toasts are less intrusive than modals
3. **Consistent Design** - All notifications follow the same pattern
4. **Accessible** - Works with screen readers
5. **Customizable** - Easy to adjust duration, position, and styling

