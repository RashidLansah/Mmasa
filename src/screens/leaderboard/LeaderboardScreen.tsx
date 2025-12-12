import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen } from '../../components/common/AppScreen';
import { AppText } from '../../components/common/AppText';
import { theme } from '../../design/theme';
import { FirestoreService, Creator } from '../../services/firestore.service';
import { AvatarService } from '../../utils/avatar';

interface LeaderboardScreenProps {
  navigation: any;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ navigation }) => {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCreators = async () => {
    try {
      console.log('📊 Fetching leaderboard creators...');
      const fetchedCreators = await FirestoreService.getCreators();
      console.log('📊 Found creators:', fetchedCreators.length);
      
      // Sort by win rate (highest first)
      const sortedCreators = [...fetchedCreators].sort((a, b) => b.winRate - a.winRate);
      setCreators(sortedCreators);
    } catch (error) {
      console.error('❌ Error fetching creators:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCreators();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCreators();
    setRefreshing(false);
  };

  const topThree = creators.slice(0, 3);
  const restOfList = creators.slice(3);

  const renderTopThree = () => (
    <View style={styles.topThreeContainer}>
      {/* 2nd Place - Left */}
      {topThree[1] && (
        <TouchableOpacity
          style={styles.topThreeCard}
          onPress={() => navigation.navigate('CreatorProfile', { creatorId: topThree[1].id })}
        >
          <Image source={{ uri: AvatarService.getAvatar(topThree[1].avatar, topThree[1].id) }} style={styles.topThreeAvatar} />
          <View style={[styles.topThreeRank, styles.silverRank]}>
            <AppText variant="caption" color="#FFFFFF" style={styles.topThreeRankText}>
              2
            </AppText>
          </View>
          <AppText variant="bodySmall" style={styles.topThreeName} numberOfLines={1}>
            {topThree[1].name}
          </AppText>
          {/* Win Rate - Most Important Stat */}
          <View style={[styles.statRow, styles.primaryStat]}>
            <Ionicons name="trophy" size={18} color="#C0C0C0" />
            <AppText variant="body" color="#C0C0C0" style={[styles.statValue, { fontWeight: 'bold' }]}>
              {topThree[1].winRate}%
            </AppText>
          </View>
          <View style={styles.topThreeStats}>
            <View style={styles.statRow}>
              <Ionicons name="people" size={12} color={theme.colors.text.secondary} />
              <AppText variant="caption" color={theme.colors.text.secondary} style={styles.statLabel}>
                {topThree[1].subscribers.toLocaleString()} subs
              </AppText>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* 1st Place - Center */}
      {topThree[0] && (
        <TouchableOpacity
          style={[styles.topThreeCard, styles.firstPlaceCard]}
          onPress={() => navigation.navigate('CreatorProfile', { creatorId: topThree[0].id })}
        >
          <View style={styles.crownContainer}>
            <Ionicons name="trophy" size={40} color="#FFD700" />
          </View>
          <Image source={{ uri: AvatarService.getAvatar(topThree[0].avatar, topThree[0].id) }} style={[styles.topThreeAvatar, styles.firstPlaceAvatar]} />
          <View style={[styles.topThreeRank, styles.goldRank]}>
            <AppText variant="body" color="#FFFFFF" style={styles.topThreeRankText}>
              1
            </AppText>
          </View>
          <AppText variant="body" style={[styles.topThreeName, styles.firstPlaceName]} numberOfLines={1}>
            {topThree[0].name}
          </AppText>
          {/* Win Rate - Most Important Stat */}
          <View style={[styles.statRow, styles.primaryStat]}>
            <Ionicons name="trophy" size={22} color="#FFD700" />
            <AppText variant="h2" color="#FFD700" style={[styles.statValue, { fontWeight: 'bold' }]}>
              {topThree[0].winRate}%
            </AppText>
          </View>
          <View style={styles.topThreeStats}>
            <View style={styles.statRow}>
              <Ionicons name="people" size={14} color={theme.colors.text.secondary} />
              <AppText variant="bodySmall" color={theme.colors.text.secondary} style={styles.statLabel}>
                {topThree[0].subscribers.toLocaleString()} subs
              </AppText>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* 3rd Place - Right */}
      {topThree[2] && (
        <TouchableOpacity
          style={styles.topThreeCard}
          onPress={() => navigation.navigate('CreatorProfile', { creatorId: topThree[2].id })}
        >
          <Image source={{ uri: AvatarService.getAvatar(topThree[2].avatar, topThree[2].id) }} style={styles.topThreeAvatar} />
          <View style={[styles.topThreeRank, styles.bronzeRank]}>
            <AppText variant="caption" color="#FFFFFF" style={styles.topThreeRankText}>
              3
            </AppText>
          </View>
          <AppText variant="bodySmall" style={styles.topThreeName} numberOfLines={1}>
            {topThree[2].name}
          </AppText>
          {/* Win Rate - Most Important Stat */}
          <View style={[styles.statRow, styles.primaryStat]}>
            <Ionicons name="trophy" size={18} color="#CD7F32" />
            <AppText variant="body" color="#CD7F32" style={[styles.statValue, { fontWeight: 'bold' }]}>
              {topThree[2].winRate}%
            </AppText>
          </View>
          <View style={styles.topThreeStats}>
            <View style={styles.statRow}>
              <Ionicons name="people" size={12} color={theme.colors.text.secondary} />
              <AppText variant="caption" color={theme.colors.text.secondary} style={styles.statLabel}>
                {topThree[2].subscribers.toLocaleString()} subs
              </AppText>
            </View>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderCreatorRow = (item: Creator, index: number) => {
    const rank = index + 4; // Starting from 4th place

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.creatorRow}
        onPress={() => navigation.navigate('CreatorProfile', { creatorId: item.id })}
      >
        <View style={styles.rowLeft}>
          <AppText variant="body" color={theme.colors.text.secondary} style={styles.rank}>
            {rank}
          </AppText>
          <Image source={{ uri: AvatarService.getAvatar(item.avatar, item.id) }} style={styles.rowAvatar} />
          <View style={styles.creatorInfo}>
            <View style={styles.nameRow}>
              <AppText variant="bodySmall" style={styles.creatorName}>
                {item.name}
              </AppText>
              {item.verifiedStatus === 'verified' && (
                <Ionicons name="checkmark-circle" size={16} color={theme.colors.accent.primary} />
              )}
            </View>
            <View style={styles.statRowHorizontal}>
              <Ionicons name="people" size={12} color={theme.colors.text.secondary} />
              <AppText variant="caption" color={theme.colors.text.secondary}>
                {item.subscribers.toLocaleString()} subscribers
              </AppText>
            </View>
          </View>
        </View>
        <View style={styles.rowRight}>
          {/* Win Rate - Primary Metric */}
          <View style={[styles.statRowHorizontal, styles.winRateBadge]}>
            <Ionicons name="trophy" size={16} color="#FFC857" />
            <AppText variant="body" color={theme.colors.text.primary} style={{ fontWeight: 'bold' }}>
              {item.winRate}%
            </AppText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="trophy-outline" size={80} color={theme.colors.text.secondary} />
      </View>
      <AppText variant="h2" style={styles.emptyTitle}>
        No Tipsters Yet
      </AppText>
      <AppText variant="body" color={theme.colors.text.secondary} style={styles.emptyDescription}>
        The leaderboard is empty. Be the first to create winning slips and climb to the top!
      </AppText>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Ionicons name="add-circle" size={20} color={theme.colors.accent.primary} />
        <AppText variant="bodySmall" color={theme.colors.accent.primary} style={{ fontWeight: '600' }}>
          Create Your First Slip
        </AppText>
      </TouchableOpacity>
    </View>
  );

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
          <AppText variant="h1" style={styles.title}>Leaderboard</AppText>
        </View>

        {/* Top 3 Section */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.accent.primary} />
          </View>
        ) : creators.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {renderTopThree()}

            {/* Global Leaderboard */}
            {restOfList.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <AppText variant="h2" style={styles.sectionTitle}>Global Leaderboard</AppText>
                  <View style={styles.legendContainer}>
                    <View style={styles.legendItem}>
                      <Ionicons name="trophy" size={14} color="#FFC857" />
                      <AppText variant="caption" color={theme.colors.text.secondary}>
                        Win Rate
                      </AppText>
                    </View>
                  </View>
                </View>
                <View style={styles.listContainer}>
                  {restOfList.map((item, index) => renderCreatorRow(item, index))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  title: {
    ...theme.typography.display,
  },
  topThreeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  topThreeCard: {
    flex: 1,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.md,
    alignItems: 'center',
    minHeight: 180,
  },
  firstPlaceCard: {
    minHeight: 220,
    marginBottom: theme.spacing.xl,
    borderWidth: 2,
    borderColor: theme.colors.accent.primary,
  },
  crownContainer: {
    position: 'absolute',
    top: -20,
  },
  topThreeAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: theme.spacing.sm,
  },
  firstPlaceAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  topThreeRank: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.background.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFD700', // Gold
  },
  silverRank: {
    backgroundColor: '#C0C0C0', // Silver
  },
  bronzeRank: {
    backgroundColor: '#CD7F32', // Bronze
  },
  topThreeRankText: {
    fontWeight: 'bold',
  },
  primaryStat: {
    marginVertical: theme.spacing.sm,
  },
  statLabel: {
    fontSize: 11,
  },
  topThreeName: {
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  firstPlaceName: {
    ...theme.typography.h3,
  },
  topThreeStats: {
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  statValue: {
    fontWeight: '600',
  },
  section: {
    marginTop: theme.spacing.xl,
  },
  sectionHeader: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.h1,
    marginBottom: theme.spacing.sm,
  },
  legendContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  listContainer: {
    paddingHorizontal: theme.spacing.lg,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rank: {
    width: 30,
    fontWeight: '600',
  },
  rowAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: theme.spacing.md,
  },
  creatorInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  creatorName: {
    fontWeight: '600',
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: theme.spacing.xs,
  },
  statRowHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  winRateBadge: {
    backgroundColor: theme.colors.background.raised,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.pill,
  },
  loadingContainer: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.xxl * 2,
  },
  emptyIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: theme.colors.background.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.xl,
    maxWidth: 300,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.background.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.pill,
    borderWidth: 2,
    borderColor: theme.colors.accent.primary,
  },
});
