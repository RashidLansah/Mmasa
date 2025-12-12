import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppScreen } from '../../components/common/AppScreen';
import { AppText } from '../../components/common/AppText';
import { AppButton } from '../../components/common/AppButton';
import { theme } from '../../design/theme';

const ONBOARDING_KEY = '@mmasa_onboarding_complete';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Track Your Betting Performance',
    text: 'Paste your betting codes. We track wins for you automatically.',
  },
  {
    id: '2',
    title: 'Discover Reliable Bet Masters',
    text: 'See transparent win rates and accuracy before you follow anyone.',
  },
  {
    id: '3',
    title: 'Bet Smarter, Not Harder',
    text: 'Make better decisions with real stats.',
  },
];

interface OnboardingScreenProps {
  navigation: any;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleNext = async () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({ x: nextIndex * width, animated: true });
    } else {
      // Mark onboarding as complete
      try {
        await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
        console.log('✅ Onboarding marked as complete');
      } catch (error) {
        console.error('Error saving onboarding status:', error);
      }
      navigation.navigate('PhoneLogin');
    }
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    setCurrentIndex(index);
  };

  return (
    <AppScreen>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {slides.map((slide) => (
          <View key={slide.id} style={styles.slide}>
            <View style={styles.content}>
              <AppText variant="display" style={styles.title}>
                {slide.title}
              </AppText>
              <AppText variant="body" color={theme.colors.text.secondary} style={styles.text}>
                {slide.text}
              </AppText>
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex ? styles.activeDot : null,
              ]}
            />
          ))}
        </View>
        <AppButton
          title={currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
          onPress={handleNext}
          style={styles.button}
        />
      </View>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xxl,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  text: {
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    padding: theme.spacing.xxl,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border.subtle,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: theme.colors.accent.primary,
    width: 24,
  },
  button: {
    width: '100%',
  },
});

