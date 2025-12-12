import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen } from '../../components/common/AppScreen';
import { AppText } from '../../components/common/AppText';
import { AppButton } from '../../components/common/AppButton';
import { StatPill } from '../../components/common/StatPill';
import { TabHeader } from '../../components/common/TabHeader';
import { Card } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/StatusBadge';
import { theme } from '../../design/theme';
import { FirestoreService, Creator, Slip } from '../../services/firestore.service';

interface CreatorProfileScreenProps {
  navigation: any;
  route: { params: { creatorId: string } };
}

const tabs = [
  { id: 'slips', label: 'Slips' },
  { id: 'about', label: 'About' },
];

export const CreatorProfileScreen: React.FC<CreatorProfileScreenProps> = ({
  navigation,
  route,
}) => {
  const { creatorId } = route.params;
  const [activeTab, setActiveTab] = useState('slips');
  const [creator, setCreator] = useState<Creator | null>(null);
  const [creatorSlips, setCreatorSlips] = useState<Slip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCreatorData = async () => {
      try {
        const [creatorData, slipsData] = await Promise.all([
          FirestoreService.getCreator(creatorId),
          FirestoreService.getSlipsByCreator(creatorId),
        ]);
        setCreator(creatorData);
        setCreatorSlips(slipsData);
      } catch (error) {
        console.error('Error fetching creator data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCreatorData();
  }, [creatorId]);

  const renderSlipCard = (slip: Slip) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('SlipDetails', { slipId: slip.id })}
    >
      <Card style={styles.slipCard}>
        <View style={styles.slipRow}>
          <View style={styles.slipInfo}>
            <AppText variant="bodySmall" style={styles.slipTitle}>
              {slip.title}
            </AppText>
            <AppText variant="caption" color={theme.colors.text.secondary}>
              {slip.sport} • {slip.league}
            </AppText>
          </View>
          <StatusBadge status={slip.status} />
        </View>
        <View style={styles.slipStats}>
          <View style={styles.slipStat}>
            <AppText variant="caption" color={theme.colors.text.secondary}>
              Odds
            </AppText>
            <AppText variant="bodySmall" style={styles.oddsValue}>
              {slip.odds?.toFixed(2) || '0.00'}
            </AppText>
          </View>
          <View style={styles.slipStat}>
            <AppText variant="caption" color={theme.colors.text.secondary}>
              Match Date
            </AppText>
            <AppText variant="bodySmall">
              {new Date(slip.matchDate).toLocaleDateString()}
            </AppText>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.accent.primary} />
          <AppText variant="body" color={theme.colors.text.secondary} style={styles.loadingText}>
            Loading creator profile...
          </AppText>
        </View>
      </AppScreen>
    );
  }

  if (!creator) {
    return (
      <AppScreen>
        <View style={styles.emptyContainer}>
          <Ionicons name="person-outline" size={64} color={theme.colors.text.secondary} />
          <AppText variant="h3" style={styles.emptyTitle}>
            Creator Not Found
          </AppText>
          <AppButton
            title="Go Back"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image source={{ uri: creator.avatar }} style={styles.avatar} />
          <View style={styles.nameRow}>
            <AppText variant="h1" style={styles.name}>
              {creator.name}
            </AppText>
            {creator.verifiedStatus === 'verified' && (
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.accent.primary} />
            )}
          </View>
          <AppText variant="bodySmall" color={theme.colors.text.secondary}>
            {creator.totalSlips || 0} slips • {creator.winRate?.toFixed(1) || '0.0'}% win rate
          </AppText>

          <AppButton
            title="Follow"
            onPress={() => {}}
            variant="primary"
            style={styles.followButton}
          />
        </View>

        <View style={styles.stats}>
          <StatPill label="Win Rate" value={`${creator.winRate?.toFixed(1) || '0.0'}%`} />
          <StatPill label="Total Slips" value={(creator.totalSlips || 0).toString()} />
          <StatPill label="Subscribers" value={(creator.subscribers || 0).toString()} />
        </View>

        <View style={styles.tabsContainer}>
          <TabHeader tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </View>

        {activeTab === 'slips' && (
          <View style={styles.content}>
            {creatorSlips.length > 0 ? (
              creatorSlips.map((slip) => (
                <View key={slip.id}>{renderSlipCard(slip)}</View>
              ))
            ) : (
              <View style={styles.emptySlips}>
                <Ionicons name="document-text-outline" size={48} color={theme.colors.text.secondary} />
                <AppText variant="body" color={theme.colors.text.secondary} style={styles.emptySlipsText}>
                  No slips yet from this creator
                </AppText>
              </View>
            )}
          </View>
        )}

        {activeTab === 'about' && (
          <View style={styles.content}>
            <Card>
              <AppText variant="body" color={theme.colors.text.secondary}>
                {creator.description || 'No description available.'}
              </AppText>
            </Card>
          </View>
        )}

        <AppButton
          title="Subscribe"
          onPress={() => navigation.navigate('Subscription', { creatorId })}
          variant="primary"
          style={styles.subscribeButton}
        />
      </ScrollView>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    padding: theme.spacing.xxl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: theme.spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  name: {
  },
  followButton: {
    marginTop: theme.spacing.lg,
    minWidth: 120,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: theme.spacing.lg,
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  tabsContainer: {
    paddingHorizontal: theme.spacing.lg,
  },
  content: {
    padding: theme.spacing.lg,
  },
  slipCard: {
    marginBottom: theme.spacing.md,
  },
  slipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slipInfo: {
    flex: 1,
  },
  slipTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  slipStats: {
    flexDirection: 'row',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
    gap: theme.spacing.xl,
  },
  slipStat: {
    alignItems: 'center',
  },
  oddsValue: {
    fontWeight: '600',
    color: theme.colors.accent.primary,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xxl,
  },
  emptyTitle: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  backButton: {
    paddingHorizontal: theme.spacing.xxl,
  },
  emptySlips: {
    alignItems: 'center',
    padding: theme.spacing.xxl,
  },
  emptySlipsText: {
    marginTop: theme.spacing.md,
  },
  subscribeButton: {
    margin: theme.spacing.lg,
  },
});

