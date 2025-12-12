import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen } from '../../components/common/AppScreen';
import { AppText } from '../../components/common/AppText';
import { theme } from '../../design/theme';
import { FirestoreService, Slip, Creator } from '../../services/firestore.service';
import { useAuth } from '../../contexts/AuthContext';
import { AvatarService } from '../../utils/avatar';

interface HomeFeedScreenProps {
  navigation: any;
}

export const HomeFeedScreen: React.FC<HomeFeedScreenProps> = ({ navigation }) => {
  const { user, userProfile } = useAuth();
  const [slips, setSlips] = useState<Slip[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fetchedSlips, fetchedCreators] = await Promise.all([
        FirestoreService.getSlips(),
        FirestoreService.getCreators()
      ]);
      
      // Filter out current user's own slips from the feed
      const filteredSlips = user 
        ? fetchedSlips.filter(slip => slip.creatorId !== user.uid)
        : fetchedSlips;
      
      // Filter out current user from trending creators
      const filteredCreators = user
        ? fetchedCreators.filter(creator => creator.id !== user.uid)
        : fetchedCreators;
      
      setSlips(filteredSlips);
      setCreators(filteredCreators.slice(0, 10));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const renderCreatorCard = (creator: Creator) => (
    <TouchableOpacity
      key={creator.id}
      style={styles.creatorCard}
      onPress={() => navigation.navigate('CreatorProfile', { creatorId: creator.id })}
    >
      <View style={styles.creatorCardHeader}>
        <AppText variant="body" style={styles.creatorCardName}>{creator.name}</AppText>
        <Image source={{ uri: AvatarService.getAvatar(creator.avatar, creator.id) }} style={styles.creatorCardAvatar} />
      </View>
      <View style={styles.creatorStats}>
        <AppText variant="caption" color={theme.colors.text.primary}>
          {creator.winRate?.toFixed(0) || 78}% Win Rate
        </AppText>
        <AppText variant="caption" color={theme.colors.text.primary}>
          85% Accuracy
        </AppText>
        <AppText variant="caption" color={theme.colors.text.primary}>
          +42% ROI
        </AppText>
      </View>
      <View style={styles.trendGraph}>
        <Ionicons name="trending-up" size={60} color={theme.colors.status.success} />
      </View>
      <View style={styles.creatorTags}>
        <View style={styles.tag}>
          <AppText variant="caption" color={theme.colors.text.primary}>EPL</AppText>
        </View>
        <View style={styles.tag}>
          <AppText variant="caption" color={theme.colors.text.primary}>ACCA Expert</AppText>
        </View>
      </View>
      <AppText variant="caption" color={theme.colors.text.secondary} style={styles.followers}>
        Followers: {(creator.subscribers || 3100).toLocaleString()}
      </AppText>
    </TouchableOpacity>
  );

  const renderSlipCard = (item: Slip, index: number) => {
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.slipCard}
        onPress={() => navigation.navigate('SlipDetails', { slipId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.slipCardContent}>
          <View style={styles.slipInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <AppText variant="body" style={styles.slipMainText}>
                Odds {item.odds?.toFixed(2) || '0.00'}
              </AppText>
              {item.isPremium && item.purchasedBy?.includes(user?.uid || '') && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="checkmark-circle" size={14} color={theme.colors.status.success} />
                  <AppText variant="caption" color={theme.colors.status.success}>
                    Unlocked
                  </AppText>
                </View>
              )}
            </View>
            <AppText variant="caption" color={theme.colors.text.primary} style={styles.slipDescription}>
              {item.title}
            </AppText>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <AppText variant="caption" color={theme.colors.text.secondary} style={styles.slipMeta}>
                by {item.creatorName}
              </AppText>
              {item.isPremium && item.price && !item.purchasedBy?.includes(user?.uid || '') && (
                <AppText variant="caption" color={theme.colors.accent.primary} style={{ fontWeight: '600' }}>
                  GH₵{item.price.toFixed(2)}
                </AppText>
              )}
            </View>
          </View>
          <View style={[
            styles.badge, 
            item.isPremium && item.purchasedBy?.includes(user?.uid || '') ? styles.unlockedBadge :
            item.isPremium ? styles.premiumBadge : 
            styles.freeBadge
          ]}>
            <AppText variant="caption" color={
              item.isPremium && item.purchasedBy?.includes(user?.uid || '') ? theme.colors.status.success :
              item.isPremium ? theme.colors.background.primary : 
              theme.colors.text.primary
            }>
              {item.isPremium && item.purchasedBy?.includes(user?.uid || '') ? 'Purchased' :
               item.isPremium ? 'Premium' : 'Free'}
            </AppText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <AppScreen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.accent.primary}
            colors={[theme.colors.accent.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Notifications')}
            style={styles.notificationButton}
          >
            <Ionicons name="notifications-outline" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
            <View>
              <AppText variant="h1" style={styles.appTitle}>SureOdds</AppText>
              <AppText variant="body" color={theme.colors.text.primary}>
                Welcome, {userProfile?.displayName || 'User'}!
              </AppText>
            </View>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Image 
              source={{ uri: userProfile?.photoURL || 'https://ui-avatars.com/api/?name=User&background=FF6B35&color=fff' }} 
              style={styles.profileAvatar} 
            />
          </TouchableOpacity>
        </View>

        {/* Trending Creators */}
        <View style={styles.section}>
          <AppText variant="h2" style={styles.sectionTitle}>Trending Creators</AppText>
          {creators.length === 0 ? (
            <View style={styles.emptyCreators}>
              <AppText variant="body" color={theme.colors.text.secondary}>
                No creators yet. Create your first slip to become a creator!
              </AppText>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.creatorsScroll}
            >
              {creators.map((creator) => (
                <View key={creator.id}>
                  {renderCreatorCard(creator)}
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Today's Odds */}
        <View style={styles.section}>
          <AppText variant="h2" style={styles.sectionTitle}>Today's Odds</AppText>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.accent.primary} />
            </View>
          ) : slips.length === 0 ? (
            <View style={styles.emptySlips}>
              <AppText variant="body" color={theme.colors.text.secondary}>
                No slips available yet
              </AppText>
              <TouchableOpacity
                onPress={() => navigation.navigate('SlipUpload')}
                style={styles.createFirstButton}
              >
                <AppText variant="bodySmall" color={theme.colors.accent.primary}>
                  Create First Slip
                </AppText>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.slipsList}>
              {slips.map((item, index) => (
                <View key={item.id || `slip-${index}`}>
                  {renderSlipCard(item, index)}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => navigation.navigate('SlipUpload')}
      >
        <Ionicons name="add" size={28} color={theme.colors.background.primary} />
      </TouchableOpacity>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appTitle: {
    ...theme.typography.display,
    marginBottom: theme.spacing.xs,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  section: {
    marginTop: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.typography.h1,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  creatorsScroll: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  emptyCreators: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
  },
  creatorCard: {
    width: 200,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.card,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    padding: theme.spacing.lg,
    minHeight: 120,
  },
  creatorCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  creatorCardName: {
    ...theme.typography.body,
    fontWeight: '600',
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  creatorCardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  creatorStats: {
    marginBottom: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  trendGraph: {
    height: 80,
    marginVertical: theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorTags: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  tag: {
    backgroundColor: theme.colors.background.raised,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.pill,
  },
  followers: {
    marginTop: theme.spacing.sm,
  },
  slipsList: {
    paddingHorizontal: theme.spacing.lg,
  },
  slipCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  slipCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  slipInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  slipMainText: {
    ...theme.typography.body,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  slipDescription: {
    marginBottom: theme.spacing.xs,
  },
  slipMeta: {
    marginTop: theme.spacing.xs,
  },
  badge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.pill,
    minWidth: 70,
    alignItems: 'center',
  },
  premiumBadge: {
    backgroundColor: theme.colors.accent.primary,
  },
  unlockedBadge: {
    backgroundColor: theme.colors.status.success,
  },
  freeBadge: {
    backgroundColor: theme.colors.background.raised,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  loadingContainer: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
  },
  emptySlips: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
  },
  createFirstButton: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.background.raised,
    borderRadius: theme.borderRadius.pill,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 80,
    right: theme.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
