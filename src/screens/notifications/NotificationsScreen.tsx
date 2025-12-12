import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen } from '../../components/common/AppScreen';
import { AppText } from '../../components/common/AppText';
import { Card } from '../../components/common/Card';
import { theme } from '../../design/theme';
import { FirestoreService, Notification } from '../../services/firestore.service';
import { useAuth } from '../../contexts/AuthContext';

interface NotificationsScreenProps {
  navigation: any;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'new_slip':
      return 'document-text';
    case 'slip_update':
      return 'checkmark-circle';
    case 'subscription':
      return 'card';
    default:
      return 'notifications';
  }
};

const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }
};

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      const fetchedNotifications = await FirestoreService.getUserNotifications(user.uid);
      setNotifications(fetchedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      await FirestoreService.markNotificationAsRead(notification.id);
    }

    // Navigate based on type
    if (notification.relatedId) {
      if (notification.type === 'slip_update' || notification.type === 'new_slip') {
        navigation.navigate('SlipDetails', { slipId: notification.relatedId });
      }
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    return (
      <TouchableOpacity onPress={() => handleNotificationPress(item)}>
        <Card style={[styles.notificationCard, !item.read && styles.unreadCard]}>
          <View style={styles.notificationContent}>
            <View style={styles.iconContainer}>
              <Ionicons 
                name={getNotificationIcon(item.type) as any} 
                size={24} 
                color={theme.colors.accent.primary} 
              />
            </View>
            <View style={styles.textContainer}>
              <AppText variant="bodySmall" style={styles.notificationTitle}>
                {item.title}
              </AppText>
              <AppText variant="bodySmall" color={theme.colors.text.secondary} style={styles.message}>
                {item.message}
              </AppText>
              <AppText variant="caption" color={theme.colors.text.secondary} style={styles.time}>
                {formatTimeAgo(item.createdAt)}
              </AppText>
            </View>
            {!item.read && <View style={styles.unreadDot} />}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.header}>
          <AppText variant="h1" style={styles.title}>Notifications</AppText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.accent.primary} />
          <AppText variant="body" color={theme.colors.text.secondary} style={styles.loadingText}>
            Loading notifications...
          </AppText>
        </View>
      </AppScreen>
    );
  }

  if (notifications.length === 0) {
    return (
      <AppScreen>
        <View style={styles.header}>
          <AppText variant="h1" style={styles.title}>Notifications</AppText>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-outline" size={64} color={theme.colors.text.secondary} />
          <AppText variant="h3" style={styles.emptyTitle}>
            No Notifications
          </AppText>
          <AppText variant="body" color={theme.colors.text.secondary} style={styles.emptyText}>
            We'll notify you when there's something new
          </AppText>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <View style={styles.header}>
        <AppText variant="h1" style={styles.title}>Notifications</AppText>
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.accent.primary}
            colors={[theme.colors.accent.primary]}
          />
        }
      />
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  list: {
    padding: theme.spacing.lg,
  },
  notificationCard: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.background.surface,
  },
  notificationContent: {
    flexDirection: 'row',
  },
  iconContainer: {
    marginRight: theme.spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  message: {
    marginBottom: theme.spacing.xs,
  },
  time: {
    marginTop: theme.spacing.xs,
  },
  unreadCard: {
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.accent.primary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.accent.primary,
    marginLeft: theme.spacing.sm,
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
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    textAlign: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
});

