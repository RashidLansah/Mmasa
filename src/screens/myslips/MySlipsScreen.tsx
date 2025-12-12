import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen } from '../../components/common/AppScreen';
import { AppText } from '../../components/common/AppText';
import { theme } from '../../design/theme';
import { FirestoreService, Slip } from '../../services/firestore.service';
import { useAuth } from '../../contexts/AuthContext';

interface MySlipsScreenProps {
  navigation: any;
}

type TabType = 'created' | 'purchased';

export const MySlipsScreen: React.FC<MySlipsScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('created');
  const [createdSlips, setCreatedSlips] = useState<Slip[]>([]);
  const [purchasedSlips, setPurchasedSlips] = useState<Slip[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSlips = async () => {
    if (!user) return;
    
    try {
      // Fetch slips created by this user
      const userCreatedSlips = await FirestoreService.getSlips(50);
      const mySlips = userCreatedSlips.filter(slip => slip.creatorId === user.uid);
      setCreatedSlips(mySlips);
      
      // TODO: Fetch purchased slips when subscription system is implemented
      setPurchasedSlips([]);
    } catch (error) {
      console.error('Error fetching slips:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSlips();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSlips();
    setRefreshing(false);
  };

  const currentSlips = activeTab === 'created' ? createdSlips : purchasedSlips;

  const renderSlipCard = (item: Slip) => {
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.slipCard}
        onPress={() => navigation.navigate('SlipDetails', { slipId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.slipCardContent}>
          <View style={styles.slipInfo}>
            <AppText variant="body" style={styles.slipMainText}>
              {item.title}
            </AppText>
            <AppText variant="caption" color={theme.colors.text.primary} style={styles.slipDescription}>
              Odds {item.odds?.toFixed(2) || '0.00'} • {item.sport}
            </AppText>
            <AppText variant="caption" color={theme.colors.text.secondary} style={styles.slipMeta}>
              {new Date(item.matchDate).toLocaleDateString()} • {item.likes} likes
            </AppText>
          </View>
          <View style={[
            styles.statusBadge, 
            item.status === 'won' ? styles.wonBadge : 
            item.status === 'lost' ? styles.lostBadge : 
            styles.pendingBadge
          ]}>
            <AppText variant="caption" color={theme.colors.text.primary}>
              {item.status.toUpperCase()}
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
          <AppText variant="h1" style={styles.title}>My Slips</AppText>
        </View>

        {/* Toggle Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'created' && styles.activeTab]}
            onPress={() => setActiveTab('created')}
          >
            <AppText 
              variant="bodySmall" 
              color={activeTab === 'created' ? theme.colors.accent.primary : theme.colors.text.secondary}
              style={styles.tabText}
            >
              My Slips
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'purchased' && styles.activeTab]}
            onPress={() => setActiveTab('purchased')}
          >
            <AppText 
              variant="bodySmall" 
              color={activeTab === 'purchased' ? theme.colors.accent.primary : theme.colors.text.secondary}
              style={styles.tabText}
            >
              Purchased
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.section}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.accent.primary} />
            </View>
          ) : currentSlips.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons 
                name={activeTab === 'created' ? 'document-text-outline' : 'cart-outline'} 
                size={64} 
                color={theme.colors.text.secondary} 
              />
              <AppText variant="h3" style={styles.emptyTitle}>
                {activeTab === 'created' ? 'No Slips Created' : 'No Slips Purchased'}
              </AppText>
              <AppText variant="body" color={theme.colors.text.secondary} style={styles.emptyText}>
                {activeTab === 'created' 
                  ? 'Create your first betting slip and share it with others'
                  : 'Purchase slips from top creators to get started'
                }
              </AppText>
              {activeTab === 'created' && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('SlipUpload')}
                  style={styles.createButton}
                >
                  <AppText variant="bodySmall" color={theme.colors.accent.primary}>
                    Create Slip
                  </AppText>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.slipsList}>
              {currentSlips.map(renderSlipCard)}
            </View>
          )}
        </View>
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
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.pill,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.borderRadius.pill,
  },
  activeTab: {
    backgroundColor: theme.colors.background.raised,
  },
  tabText: {
    fontWeight: '600',
  },
  section: {
    marginTop: theme.spacing.md,
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
  statusBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.pill,
    minWidth: 70,
    alignItems: 'center',
  },
  wonBadge: {
    backgroundColor: theme.colors.status.success,
  },
  lostBadge: {
    backgroundColor: theme.colors.status.error,
  },
  pendingBadge: {
    backgroundColor: theme.colors.background.raised,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  loadingContainer: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xxl,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  createButton: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.background.raised,
    borderRadius: theme.borderRadius.pill,
    borderWidth: 1,
    borderColor: theme.colors.accent.primary,
  },
});

