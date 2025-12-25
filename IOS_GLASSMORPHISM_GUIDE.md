# iOS Glassmorphism (iOS 16+ Glass Effect) Guide

## ✅ Implemented

### Components Created
1. **GlassCard** (`src/components/common/GlassCard.tsx`)
   - Standalone glassmorphism card component
   - Uses native iOS blur via `expo-blur`
   - Falls back gracefully on Android/Web

2. **Card Component Updated** (`src/components/common/Card.tsx`)
   - Added `glass` prop to enable glassmorphism
   - Optional `intensity` and `tint` props
   - Backward compatible (defaults to solid card)

3. **Tab Bar Glass Effect** (`src/navigation/MainTabs.tsx`)
   - Tab bar now uses native iOS blur
   - Frosted glass effect on iOS
   - Transparent background with blur

## 📱 Usage Examples

### Basic Glass Card
```tsx
import { Card } from '../../components/common/Card';

<Card glass>
  <AppText>This card has a glass effect!</AppText>
</Card>
```

### Glass Card with Custom Intensity
```tsx
<Card glass intensity={90} tint="dark">
  <AppText>Stronger blur effect</AppText>
</Card>
```

### Standalone GlassCard
```tsx
import { GlassCard } from '../../components/common/GlassCard';

<GlassCard intensity={80} tint="dark">
  <AppText>Frosted glass card</AppText>
</GlassCard>
```

## 🎨 Where to Use Glassmorphism

### Recommended:
- ✅ Tab bar (already implemented)
- ✅ Modal overlays
- ✅ Floating action buttons
- ✅ Premium/feature cards
- ✅ Notification panels
- ✅ Settings panels

### Optional:
- Slip cards (can add `glass` prop)
- Creator cards (can add `glass` prop)
- Profile cards
- Subscription cards

## 🔧 Props

### Card Component
- `glass?: boolean` - Enable glassmorphism (default: false)
- `intensity?: number` - Blur intensity 0-100 (default: 60)
- `tint?: 'light' | 'dark' | 'default'` - Blur tint (default: 'dark')

### GlassCard Component
- `intensity?: number` - Blur intensity 0-100 (default: 80)
- `tint?: 'light' | 'dark' | 'default'` - Blur tint (default: 'dark')

## 📝 Notes

- **iOS Only**: Native blur effect only works on iOS
- **Android/Web**: Falls back to semi-transparent background
- **Performance**: Native blur is hardware-accelerated on iOS
- **Accessibility**: Works with screen readers

## 🚀 Next Steps

To add glass effect to more components:
1. Add `glass` prop to existing `<Card>` components
2. Replace `<Card>` with `<GlassCard>` where needed
3. Adjust `intensity` based on content visibility needs

