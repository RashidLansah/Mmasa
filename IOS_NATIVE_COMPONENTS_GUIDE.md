# iOS Native Components & Style Guidelines

## Current Status

### ✅ Already iOS-Friendly
- SafeAreaView usage
- Action Sheets (@expo/react-native-action-sheet)
- Toast notifications
- Platform.OS checks

### ❌ Needs iOS-Native Updates
- TouchableOpacity → Pressable
- Custom theme → iOS system colors
- Custom buttons → iOS button styles
- Missing iOS haptics
- Not using SF Symbols
- Custom fonts → iOS system font

## Recommended Updates

### 1. Replace TouchableOpacity with Pressable
Pressable is the iOS-native button component with better haptic feedback.

### 2. Use iOS System Colors
Use `useColorScheme()` to detect light/dark mode and iOS system colors.

### 3. Add iOS Haptics
Use `expo-haptics` for native iOS haptic feedback.

### 4. Use SF Symbols (Optional)
Consider using SF Symbols instead of Ionicons for more native feel.

### 5. Use iOS System Font
Use San Francisco font family (system default on iOS).

