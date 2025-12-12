export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Onboarding: undefined;
  PhoneLogin: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  HomeStack: undefined;
  MySlipsStack: undefined;
  WalletStack: undefined;
  LeaderboardStack: undefined;
};

export type HomeStackParamList = {
  HomeFeed: undefined;
  CreatorProfile: { creatorId: string };
  SlipDetails: { slipId: string };
  SlipUpload: undefined;
  Subscription: { creatorId?: string };
  Settings: undefined;
  ManageSubscription: undefined;
  PaymentMethods: undefined;
  Notifications: undefined;
};

export type LeaderboardStackParamList = {
  Leaderboard: undefined;
  CreatorProfile: { creatorId: string };
  SlipDetails: { slipId: string };
  Subscription: { creatorId?: string };
};

export type NotificationsStackParamList = {
  Notifications: undefined;
  SlipDetails: { slipId: string };
  CreatorProfile: { creatorId: string };
};

export type SettingsStackParamList = {
  Settings: undefined;
  ManageSubscription: undefined;
  PaymentMethods: undefined;
  UpdateResults: undefined;
};

export type MySlipsStackParamList = {
  MySlips: undefined;
  SlipDetails: { slipId: string };
  SlipUpload: undefined;
};

export type WalletStackParamList = {
  Wallet: undefined;
  AddAccount: undefined;
  Withdraw: undefined;
  Transactions: undefined;
};



