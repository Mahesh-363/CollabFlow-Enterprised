import { create } from 'zustand';
import {
  User,
  Workspace,
  Channel,
  Message,
  ThreadReply,
  DirectMessageConversation,
  UserPresence,
  ActiveHuddle,
  FileAttachment,
  NavSection,
  CalendarEvent,
  Meeting,
  Task,
  TaskStatus,
  TaskPriority,
  Reminder,
  NotificationItem,
  WorkspaceFile,
} from '../types/collab';
import {
  INITIAL_USERS,
  INITIAL_WORKSPACES,
  INITIAL_CHANNELS,
  INITIAL_DMS,
  INITIAL_MESSAGES,
  INITIAL_THREAD_REPLIES,
  INITIAL_CALENDAR_EVENTS,
  INITIAL_MEETINGS,
  INITIAL_TASKS,
  INITIAL_REMINDERS,
  INITIAL_NOTIFICATIONS,
  INITIAL_FILES,
} from '../data/mockCollabData';
import { generateMeetingCode } from '../utils/collabSuiteLogic';
import {
  toggleMessageReaction,
  addMessageReaction,
  removeMessageReaction,
  calculateThreadMetrics,
  canDeleteMessage,
  canEditMessage,
} from '../utils/collabLogic';
import {
  issueJWTSession,
  getDefaultChannelsForUseCase,
  slugifyWorkspace,
} from '../utils/authLogic';
import { soundEffects } from '../utils/audioChime';
import { apiClient } from '../api/client';
import { socketManager } from '../api/socket';

export type AppTheme = 'slack' | 'teams' | 'midnight' | 'light';

export interface ToastAlert {
  id: string;
  authorName: string;
  channelName: string;
  content: string;
  time: string;
  channelId: string;
}

export interface AuthSession {
  provider: 'microsoft' | 'apple' | 'google' | 'email' | 'phone' | 'demo';
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  accountEmail: string;
  tokenRotationCount: number;
  tenantId?: string;
  methodLabel: string;
}

export interface EnterpriseTrial {
  isActive: boolean;
  plan: 'enterprise_trial' | 'enterprise_pro';
  daysRemaining: number;
  planName: string;
  tier: 'Enterprise Scale';
  features: string[];
}

interface CollabState {
  users: User[];
  currentUser: User;
  workspaces: Workspace[];
  activeWorkspaceId: string;
  channels: Channel[];
  activeChannelId: string;
  directMessages: DirectMessageConversation[];
  messages: Message[];
  threadReplies: Record<string, ThreadReply[]>;
  activeThreadMessageId: string | null;
  typingUsers: Record<string, string[]>;
  activeHuddle: ActiveHuddle | null;
  theme: AppTheme;
  isSearchOpen: boolean;
  isCreateChannelOpen: boolean;
  isProfileOpen: boolean;
  isArchitectureOpen: boolean;
  isPresenceInspectorOpen: boolean;
  isMobileSidebarOpen: boolean;
  soundEnabled: boolean;
  toasts: ToastAlert[];
  lastActivityTimestamp: number;
  redisPresenceMap: Record<string, { status: UserPresence; lastSeen: number; socketCount: number }>;

  // Navigation & Suite State
  activeNav: NavSection;
  calendarEvents: CalendarEvent[];
  meetings: Meeting[];
  tasks: Task[];
  reminders: Reminder[];
  notifications: NotificationItem[];
  workspaceFiles: WorkspaceFile[];

  // Meeting Room & Live WebRTC State
  activeMeeting: Meeting | null;
  isInMeetingRoom: boolean;
  meetingMediaState: {
    isMuted: boolean;
    isCameraOff: boolean;
    isScreenSharing: boolean;
    isHandRaised: boolean;
  };
  isQuickCreateOpen: boolean;
  isSidebarCollapsed: boolean;
  isHelpModalOpen: boolean;

  // Authentication & Onboarding State
  isAuthenticated: boolean;
  isAuthView: boolean;
  authSession: AuthSession;
  enterpriseTrial: EnterpriseTrial;
  isAuthInspectorOpen: boolean;

  // Backend & Real-time Integration State
  backendConnected: boolean;
  backendLatencyMs: number | null;
  isCheckingBackend: boolean;
  backendStatusText: string;
  checkBackendHealth: () => Promise<boolean>;
  syncFromBackend: () => Promise<void>;

  // Actions
  setActiveNav: (nav: NavSection) => void;
  setQuickCreateOpen: (open: boolean) => void;
  createCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  updateCalendarEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteCalendarEvent: (id: string) => void;
  scheduleMeeting: (meeting: Omit<Meeting, 'id' | 'meetingLink' | 'status'>) => void;
  startInstantMeeting: (title?: string) => Meeting;
  joinMeeting: (meetingId: string) => void;
  leaveMeeting: () => void;
  toggleMeetingMic: () => void;
  toggleMeetingCamera: () => void;
  toggleMeetingScreenShare: () => void;
  toggleMeetingHandRaise: () => void;
  sendMeetingChatMessage: (meetingId: string, content: string) => void;
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'commentsCount'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteTask: (id: string) => void;
  createReminder: (reminder: Omit<Reminder, 'id' | 'createdAt' | 'completed'>) => void;
  toggleReminderComplete: (id: string) => void;
  snoozeReminder: (id: string, minutes: number) => void;
  deleteReminder: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotification: (id: string) => void;
  uploadWorkspaceFile: (file: Omit<WorkspaceFile, 'id' | 'uploadedAt'>) => void;
  deleteWorkspaceFile: (id: string) => void;

  setIsAuthView: (isAuthView: boolean) => void;
  setAuthInspectorOpen: (open: boolean) => void;
  loginWithEmail: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGmail: (options?: { email?: string; name?: string; picture?: string }) => Promise<{ success: boolean; error?: string }>;
  signupWithEmail: (account: { name: string; email: string; password?: string; workspaceName?: string }) => Promise<{ success: boolean; error?: string }>;
  loginWithMicrosoft: (accountType: 'work_school' | 'personal_outlook', emailOverride?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithApple: (options: { hideEmail: boolean; email?: string }) => Promise<{ success: boolean; error?: string }>;
  loginWithPhone: (phoneE164: string, otpCode: string) => Promise<{ success: boolean; error?: string }>;
  loginAsPersona: (userId: string) => void;
  logout: () => void;
  completeOnboarding: (
    account: { name: string; email: string },
    workspace: { name: string; slug: string; useCase: string; teamSize: string }
  ) => void;
  setActiveChannel: (channelId: string) => void;
  setActiveWorkspace: (workspaceId: string) => void;
  sendMessage: (channelId: string, content: string, attachments?: FileAttachment[]) => void;
  editMessage: (messageId: string, newContent: string) => void;
  deleteMessage: (messageId: string) => void;
  toggleReaction: (messageId: string, emoji: string) => void;
  addReaction: (messageId: string, emoji: string, userId?: string) => void;
  removeReaction: (messageId: string, emoji: string, userId?: string) => void;
  openThread: (messageId: string) => void;
  closeThread: () => void;
  sendThreadReply: (messageId: string, content: string) => void;
  toggleThreadReaction: (replyId: string, emoji: string) => void;
  createChannel: (name: string, description: string, topic: string, isPrivate: boolean) => void;
  switchCurrentUser: (userId: string) => void;
  updateUserPresence: (presence: UserPresence, customStatus?: string) => void;
  recordUserActivity: () => void;
  checkInactivityTimer: () => void;
  setPresenceInspectorOpen: (open: boolean) => void;
  setTyping: (channelId: string, userName: string, isTyping: boolean) => void;
  startHuddle: (channelId: string) => void;
  toggleHuddleMute: () => void;
  toggleHuddleScreenshare: () => void;
  endHuddle: () => void;
  setTheme: (theme: AppTheme) => void;
  setSearchOpen: (open: boolean) => void;
  setCreateChannelOpen: (open: boolean) => void;
  setProfileOpen: (open: boolean) => void;
  setArchitectureOpen: (open: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  dismissToast: (id: string) => void;
  simulateColleagueMessage: (scenario?: 'benchmarks' | 'incident' | 'design') => void;
  isGameOpen: boolean;
  setGameOpen: (open: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setHelpModalOpen: (open: boolean) => void;
}

export const useCollabStore = create<CollabState>((set, get) => ({
  users: INITIAL_USERS,
  currentUser: INITIAL_USERS[0], // Elena Vance (Owner)
  workspaces: INITIAL_WORKSPACES,
  activeWorkspaceId: INITIAL_WORKSPACES[0].id,
  channels: INITIAL_CHANNELS,
  activeChannelId: INITIAL_CHANNELS[1].id, // #engineering-core
  directMessages: INITIAL_DMS,
  messages: INITIAL_MESSAGES,
  threadReplies: INITIAL_THREAD_REPLIES,
  activeThreadMessageId: null,
  typingUsers: {},
  activeHuddle: null,
  theme: 'slack',
  isSearchOpen: false,
  isCreateChannelOpen: false,
  isProfileOpen: false,
  isArchitectureOpen: false,
  isPresenceInspectorOpen: false,
  isMobileSidebarOpen: false,
  soundEnabled: true,
  toasts: [],
  lastActivityTimestamp: Date.now(),
  redisPresenceMap: {
    'user-elena': { status: 'online', lastSeen: Date.now(), socketCount: 2 },
    'user-alex': { status: 'online', lastSeen: Date.now() - 15000, socketCount: 1 },
    'user-david': { status: 'online', lastSeen: Date.now() - 45000, socketCount: 1 },
    'user-maya': { status: 'dnd', lastSeen: Date.now() - 180000, socketCount: 1 },
    'user-jordan': { status: 'offline', lastSeen: Date.now() - 3600000, socketCount: 0 },
    'user-bot': { status: 'online', lastSeen: Date.now(), socketCount: 4 },
  },

  // Authentication & Onboarding initial state
  isAuthenticated: typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('autostart') === '1',
  isAuthView: !(typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('autostart') === '1'),
  authSession: {
    provider: 'demo',
    accessToken: 'cf_jwt_access_init_sample',
    refreshToken: 'cf_jwt_refresh_init_sample',
    expiresAt: Date.now() + 900000,
    accountEmail: 'elena.vance@acme.corp',
    tokenRotationCount: 1,
    methodLabel: 'Enterprise Single Sign-On',
  },
  enterpriseTrial: {
    isActive: true,
    plan: 'enterprise_trial',
    daysRemaining: 14,
    planName: 'Enterprise Trial (14 Days)',
    tier: 'Enterprise Scale',
    features: [
      'Unlimited Message History & Search',
      'High-Scale Redis 7.2 Presence Tracking',
      'Real-Time Channels & Huddle Voice / Screen Share',
      'Microsoft Entra ID & Apple ID Single Sign-On',
      'Role-Based Access Control (RBAC) & Audit Logs',
    ],
  },
  isAuthInspectorOpen: false,
  isGameOpen: false,

  // Navigation & Suite Initial State
  activeNav: 'home',
  calendarEvents: INITIAL_CALENDAR_EVENTS,
  meetings: INITIAL_MEETINGS,
  tasks: INITIAL_TASKS,
  reminders: INITIAL_REMINDERS,
  notifications: INITIAL_NOTIFICATIONS,
  workspaceFiles: INITIAL_FILES,
  activeMeeting: null,
  isInMeetingRoom: false,
  meetingMediaState: {
    isMuted: false,
    isCameraOff: false,
    isScreenSharing: false,
    isHandRaised: false,
  },
  isQuickCreateOpen: false,
  isSidebarCollapsed: typeof window !== 'undefined' ? localStorage.getItem('cf_sidebar_collapsed') === 'true' : false,
  isHelpModalOpen: false,

  toggleSidebarCollapsed: () => {
    set((state) => {
      const next = !state.isSidebarCollapsed;
      if (typeof window !== 'undefined') {
        localStorage.setItem('cf_sidebar_collapsed', String(next));
      }
      return { isSidebarCollapsed: next };
    });
  },

  setSidebarCollapsed: (collapsed: boolean) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cf_sidebar_collapsed', String(collapsed));
    }
    set({ isSidebarCollapsed: collapsed });
  },

  setHelpModalOpen: (open: boolean) => set({ isHelpModalOpen: open }),

  setIsAuthView: (isAuthView: boolean) => set({ isAuthView }),

  setAuthInspectorOpen: (isAuthInspectorOpen: boolean) => set({ isAuthInspectorOpen }),

  setGameOpen: (isGameOpen: boolean) => set({ isGameOpen }),

  backendConnected: false,
  backendLatencyMs: null,
  isCheckingBackend: false,
  backendStatusText: 'Standby / Local In-Memory Fallback Active',

  checkBackendHealth: async () => {
    const rawApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
    if (!rawApiUrl) {
      set({
        backendConnected: false,
        backendLatencyMs: null,
        backendStatusText: 'Demo Mode Active (Local)',
        isCheckingBackend: false,
      });
      return false;
    }

    set({ isCheckingBackend: true });
    try {
      const res = await apiClient.checkHealth();
      if (res.isHealthy) {
        set({
          backendConnected: true,
          backendLatencyMs: res.latencyMs,
          backendStatusText: `Connected to Django/Daphne (${res.latencyMs}ms)`,
          isCheckingBackend: false,
        });
        // Connect websocket for active channel
        socketManager.connect(get().activeChannelId);
        get().syncFromBackend();
        return true;
      } else {
        set({
          backendConnected: false,
          backendLatencyMs: null,
          backendStatusText: 'Demo Mode Active (Local)',
          isCheckingBackend: false,
        });
        return false;
      }
    } catch {
      set({
        backendConnected: false,
        backendLatencyMs: null,
        backendStatusText: 'Demo Mode Active (Local)',
        isCheckingBackend: false,
      });
      return false;
    }
  },

  syncFromBackend: async () => {
    try {
      const activeWs = get().activeWorkspaceId;
      const [channelsData, tasksData, eventsData] = await Promise.allSettled([
        apiClient.chat.getChannels(activeWs),
        apiClient.tasks.list(activeWs),
        apiClient.calendar.list(activeWs),
      ]);

      if (channelsData.status === 'fulfilled' && Array.isArray(channelsData.value)) {
        set({ channels: channelsData.value });
      }
      if (tasksData.status === 'fulfilled' && Array.isArray(tasksData.value)) {
        set({ tasks: tasksData.value });
      }
      if (eventsData.status === 'fulfilled' && Array.isArray(eventsData.value)) {
        set({ calendarEvents: eventsData.value });
      }
    } catch {
      // Keep existing memory state on fetch fail
    }
  },

  loginWithEmail: async (email: string) => {
    const { users } = get();
    const existing = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    const targetUser: User = existing || {
      id: `user-${Date.now()}`,
      name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      email: email.trim().toLowerCase(),
      avatar: email.slice(0, 2).toUpperCase(),
      title: 'Senior Collaborator',
      role: 'member',
      presence: 'online',
      customStatus: 'Collaborating via CollabFlow',
    };

    const newUsers = existing ? users : [...users, targetUser];
    const jwtSession = issueJWTSession(targetUser);

    set((state) => ({
      users: newUsers,
      currentUser: targetUser,
      isAuthenticated: true,
      isAuthView: false,
      authSession: {
        provider: 'email',
        accessToken: jwtSession.accessToken,
        refreshToken: jwtSession.refreshToken,
        expiresAt: jwtSession.expiresAt,
        accountEmail: targetUser.email,
        tokenRotationCount: 1,
        methodLabel: 'Email & Password Auth',
      },
      toasts: [
        ...state.toasts,
        {
          id: `toast-${Date.now()}`,
          authorName: 'CollabFlow Security',
          channelName: 'Auth Service',
          content: `Welcome back, ${targetUser.name}! Secure JWT session created.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          channelId: state.activeChannelId,
        },
      ],
    }));

    return { success: true };
  },

  loginWithGmail: async (options?: { email?: string; name?: string; picture?: string }) => {
    const { users } = get();
    const email = (options?.email || 'maheshmass363@gmail.com').trim().toLowerCase();
    const displayName = options?.name || (email.toLowerCase().includes('mahesh') ? 'Mahesh' : email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
    const existing = users.find((u) => u.email.toLowerCase() === email);

    const targetUser: User = existing || {
      id: `user-google-${Date.now()}`,
      name: displayName,
      email,
      avatar: displayName.slice(0, 2).toUpperCase() || 'GM',
      title: 'Google Workspace Collaborator',
      role: 'owner',
      presence: 'online',
      customStatus: 'Signed in with Gmail / Google Identity',
    };

    const newUsers = existing ? users : [...users, targetUser];
    const jwtSession = issueJWTSession(targetUser);

    set((state) => ({
      users: newUsers,
      currentUser: targetUser,
      isAuthenticated: true,
      isAuthView: false,
      authSession: {
        provider: 'google',
        accessToken: jwtSession.accessToken,
        refreshToken: jwtSession.refreshToken,
        expiresAt: jwtSession.expiresAt,
        accountEmail: targetUser.email,
        tokenRotationCount: 1,
        methodLabel: 'Google Identity & Gmail OAuth',
      },
      toasts: [
        ...state.toasts,
        {
          id: `toast-${Date.now()}`,
          authorName: 'Google Identity Services',
          channelName: 'OAuth 2.0 & Gmail',
          content: `Authenticated successfully with Gmail (${targetUser.email}). Welcome to CollabFlow!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          channelId: state.activeChannelId,
        },
      ],
    }));

    return { success: true };
  },

  signupWithEmail: async (account: { name: string; email: string; password?: string; workspaceName?: string }) => {
    const { users } = get();
    const email = account.email.trim().toLowerCase();
    const existing = users.find((u) => u.email.toLowerCase() === email);
    if (existing) {
      return { success: false, error: 'An account with this email already exists. Please sign in instead.' };
    }

    const newUserId = `user-${Date.now()}`;
    const workspaceTitle = account.workspaceName?.trim() || `${account.name.split(' ')[0] || 'Team'}'s Workspace`;
    const newUser: User = {
      id: newUserId,
      name: account.name.trim() || 'New Collaborator',
      email,
      avatar: account.name
        .split(' ')
        .map((s) => s[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'CF',
      title: `${workspaceTitle} Lead`,
      role: 'owner',
      presence: 'online',
      customStatus: 'Just joined CollabFlow',
    };

    const jwtSession = issueJWTSession(newUser);

    set((state) => ({
      users: [...state.users, newUser],
      currentUser: newUser,
      isAuthenticated: true,
      isAuthView: false,
      authSession: {
        provider: 'email',
        accessToken: jwtSession.accessToken,
        refreshToken: jwtSession.refreshToken,
        expiresAt: jwtSession.expiresAt,
        accountEmail: newUser.email,
        tokenRotationCount: 1,
        methodLabel: 'Direct Email Registration',
      },
      toasts: [
        ...state.toasts,
        {
          id: `toast-${Date.now()}`,
          authorName: 'CollabFlow Onboarding',
          channelName: 'Account Created',
          content: `Account created for ${newUser.name}! Your workspace is initialized.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          channelId: state.activeChannelId,
        },
      ],
    }));

    return { success: true };
  },

  loginWithMicrosoft: async (accountType: 'work_school' | 'personal_outlook', emailOverride?: string) => {
    const { users } = get();
    const email = emailOverride || (accountType === 'work_school' ? 'elena.vance@acme.corp' : 'user.outlook@outlook.com');
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    const targetUser: User = existing || {
      id: `user-ms-${Date.now()}`,
      name: accountType === 'work_school' ? 'Elena Vance' : 'Outlook Microsoft User',
      email,
      avatar: 'MS',
      title: accountType === 'work_school' ? 'Staff Distributed Systems Architect' : 'Microsoft 365 Cloud User',
      role: accountType === 'work_school' ? 'owner' : 'member',
      presence: 'online',
      customStatus: 'Connected via Microsoft Entra ID',
    };

    const newUsers = existing ? users : [...users, targetUser];
    const jwtSession = issueJWTSession(targetUser);

    set((state) => ({
      users: newUsers,
      currentUser: targetUser,
      isAuthenticated: true,
      isAuthView: false,
      authSession: {
        provider: 'microsoft',
        accessToken: jwtSession.accessToken,
        refreshToken: jwtSession.refreshToken,
        expiresAt: jwtSession.expiresAt,
        accountEmail: targetUser.email,
        tokenRotationCount: 1,
        tenantId: accountType === 'work_school' ? 'tenant-acme-corp-azure-ad' : 'common-microsoft-account',
        methodLabel: accountType === 'work_school' ? 'Microsoft Entra ID (Work/School)' : 'Microsoft Personal / Outlook',
      },
      toasts: [
        ...state.toasts,
        {
          id: `toast-${Date.now()}`,
          authorName: 'Microsoft Identity',
          channelName: 'OAuth 2.0',
          content: `OAuth authorization granted. Identity linked to ${targetUser.email}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          channelId: state.activeChannelId,
        },
      ],
    }));

    return { success: true };
  },

  loginWithApple: async (options: { hideEmail: boolean; email?: string }) => {
    const { users } = get();
    const relayEmail = options.hideEmail ? `relay.${Math.random().toString(36).substring(2, 8)}@privaterelay.appleid.com` : (options.email || 'developer@apple.user');
    const existing = users.find((u) => u.email.toLowerCase() === relayEmail.toLowerCase());

    const targetUser: User = existing || {
      id: `user-apple-${Date.now()}`,
      name: 'Apple ID Colleague',
      email: relayEmail,
      avatar: '🍎',
      title: 'Product & iOS Specialist',
      role: 'member',
      presence: 'online',
      customStatus: 'Signed in with Apple ID (Private Relay)',
    };

    const newUsers = existing ? users : [...users, targetUser];
    const jwtSession = issueJWTSession(targetUser);

    set((state) => ({
      users: newUsers,
      currentUser: targetUser,
      isAuthenticated: true,
      isAuthView: false,
      authSession: {
        provider: 'apple',
        accessToken: jwtSession.accessToken,
        refreshToken: jwtSession.refreshToken,
        expiresAt: jwtSession.expiresAt,
        accountEmail: targetUser.email,
        tokenRotationCount: 1,
        methodLabel: options.hideEmail ? 'Apple ID (Private Email Relay)' : 'Sign in with Apple',
      },
      toasts: [
        ...state.toasts,
        {
          id: `toast-${Date.now()}`,
          authorName: 'Apple Sign-In',
          channelName: 'Biometrics & OIDC',
          content: `Identity verified via Apple ID. Relay: ${relayEmail}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          channelId: state.activeChannelId,
        },
      ],
    }));

    return { success: true };
  },

  loginWithPhone: async (phoneE164: string) => {
    const { users } = get();
    const syntheticEmail = `phone.${phoneE164.replace(/\D/g, '')}@mobile.collabflow.internal`;
    const existing = users.find((u) => u.email === syntheticEmail);

    const targetUser: User = existing || {
      id: `user-phone-${Date.now()}`,
      name: `Mobile User (${phoneE164})`,
      email: syntheticEmail,
      avatar: '📱',
      title: 'Mobile Verified Specialist',
      role: 'member',
      presence: 'online',
      customStatus: 'Verified via 6-digit SMS OTP',
    };

    const newUsers = existing ? users : [...users, targetUser];
    const jwtSession = issueJWTSession(targetUser);

    set((state) => ({
      users: newUsers,
      currentUser: targetUser,
      isAuthenticated: true,
      isAuthView: false,
      authSession: {
        provider: 'phone',
        accessToken: jwtSession.accessToken,
        refreshToken: jwtSession.refreshToken,
        expiresAt: jwtSession.expiresAt,
        accountEmail: syntheticEmail,
        tokenRotationCount: 1,
        methodLabel: `Phone OTP (${phoneE164})`,
      },
      toasts: [
        ...state.toasts,
        {
          id: `toast-${Date.now()}`,
          authorName: 'SMS OTP Gateway',
          channelName: 'Phone Auth',
          content: `Two-factor OTP verified for ${phoneE164}. Session initialized.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          channelId: state.activeChannelId,
        },
      ],
    }));

    return { success: true };
  },

  loginAsPersona: (userId: string) => {
    const { users } = get();
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    const jwtSession = issueJWTSession(user);

    set({
      currentUser: user,
      isAuthenticated: true,
      isAuthView: false,
      authSession: {
        provider: 'demo',
        accessToken: jwtSession.accessToken,
        refreshToken: jwtSession.refreshToken,
        expiresAt: jwtSession.expiresAt,
        accountEmail: user.email,
        tokenRotationCount: 1,
        methodLabel: `Persona (${user.name} - ${user.role})`,
      },
    });
  },

  logout: () => {
    set({
      isAuthenticated: false,
      isAuthView: true,
    });
  },

  completeOnboarding: (
    account: { name: string; email: string },
    workspace: { name: string; slug: string; useCase: string; teamSize: string }
  ) => {
    const { users, workspaces, channels } = get();
    const newUserId = `user-owner-${Date.now()}`;
    const newUser: User = {
      id: newUserId,
      name: account.name.trim(),
      email: account.email.trim().toLowerCase(),
      avatar: account.name
        .split(' ')
        .map((s) => s[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'CF',
      title: `${workspace.name} Founder & Lead`,
      role: 'owner',
      presence: 'online',
      customStatus: 'Setting up new workspace',
    };

    const newWsId = `ws-${Date.now()}`;
    const generatedChannels = getDefaultChannelsForUseCase(workspace.useCase).map((ch, idx) => ({
      id: `ch-onboard-${Date.now()}-${idx}`,
      workspaceId: newWsId,
      name: ch.name,
      description: ch.description,
      topic: ch.topic,
      isPrivate: ch.isPrivate,
      memberIds: [newUserId],
      unreadCount: 0,
      createdById: newUserId,
      createdAt: new Date().toISOString(),
    }));

    const newWorkspace: Workspace = {
      id: newWsId,
      name: workspace.name.trim(),
      slug: slugifyWorkspace(workspace.slug || workspace.name),
      icon: workspace.name.slice(0, 2).toUpperCase(),
      color: 'from-violet-600 to-indigo-600',
      ownerId: newUserId,
      memberCount: parseInt(workspace.teamSize, 10) || 8,
      channels: generatedChannels,
    };

    const jwtSession = issueJWTSession(newUser);

    set((state) => ({
      users: [newUser, ...users],
      currentUser: newUser,
      workspaces: [newWorkspace, ...workspaces],
      activeWorkspaceId: newWsId,
      channels: [...generatedChannels, ...channels],
      activeChannelId: generatedChannels[0].id,
      isAuthenticated: true,
      isAuthView: false,
      enterpriseTrial: {
        isActive: true,
        plan: 'enterprise_trial',
        daysRemaining: 14,
        planName: 'Enterprise Trial (14 Days Remaining)',
        tier: 'Enterprise Scale',
        features: state.enterpriseTrial.features,
      },
      authSession: {
        provider: 'email',
        accessToken: jwtSession.accessToken,
        refreshToken: jwtSession.refreshToken,
        expiresAt: jwtSession.expiresAt,
        accountEmail: newUser.email,
        tokenRotationCount: 1,
        methodLabel: `Workspace Creation (${workspace.name})`,
      },
      toasts: [
        ...state.toasts,
        {
          id: `toast-${Date.now()}`,
          authorName: 'CollabFlow Onboarding',
          channelName: `#${generatedChannels[0].name}`,
          content: `Welcome to ${workspace.name}! 14-Day Enterprise Trial is now active.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          channelId: generatedChannels[0].id,
        },
      ],
    }));
  },

  setActiveChannel: (channelId: string) => {
    // Clear unread count on current channel
    set((state) => ({
      activeChannelId: channelId,
      channels: state.channels.map((ch) =>
        ch.id === channelId ? { ...ch, unreadCount: 0 } : ch
      ),
      directMessages: state.directMessages.map((dm) =>
        dm.id === channelId ? { ...dm, unreadCount: 0 } : dm
      ),
    }));
  },

  setActiveWorkspace: (workspaceId: string) => {
    set({ activeWorkspaceId: workspaceId });
  },

  sendMessage: (channelId: string, content: string, attachments?: FileAttachment[]) => {
    const { currentUser, messages, backendConnected } = get();
    const newMsg: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      channelId,
      userId: currentUser.id,
      content,
      createdAt: new Date().toISOString(),
      reactions: [],
      replyCount: 0,
      attachments: attachments || [],
    };

    set({ messages: [...messages, newMsg] });
    soundEffects.playMessageChime();

    // Broadcast over WebSocket
    socketManager.send({
      type: 'chat_message',
      channel_id: channelId,
      content,
    });

    // Real API persistence when backend is active
    if (backendConnected) {
      apiClient.chat.sendMessage({
        channel: channelId,
        content,
        attachments: attachments || [],
      }).catch(() => {
        // Optimistic state preserved; gracefully handled
      });
    }
  },

  editMessage: (messageId: string, newContent: string) => {
    const { currentUser, messages, backendConnected } = get();
    set({
      messages: messages.map((m) => {
        if (m.id === messageId && canEditMessage(currentUser, m)) {
          return {
            ...m,
            content: newContent,
            isEdited: true,
            updatedAt: new Date().toISOString(),
          };
        }
        return m;
      }),
    });

    if (backendConnected) {
      apiClient.chat.editMessage(messageId, newContent).catch(() => {});
    }
  },

  deleteMessage: (messageId: string) => {
    const { currentUser, messages, activeThreadMessageId, backendConnected } = get();
    set({
      messages: messages.map((m) => {
        if (m.id === messageId && canDeleteMessage(currentUser, m)) {
          return {
            ...m,
            content: 'This message was deleted.',
            isDeleted: true,
            attachments: [],
          };
        }
        return m;
      }),
      activeThreadMessageId: activeThreadMessageId === messageId ? null : activeThreadMessageId,
    });

    if (backendConnected) {
      apiClient.chat.deleteMessage(messageId).catch(() => {});
    }
  },

  toggleReaction: (messageId: string, emoji: string) => {
    const { currentUser, messages } = get();
    soundEffects.playReactionPop();
    set({
      messages: messages.map((m) => {
        if (m.id === messageId) {
          return {
            ...m,
            reactions: toggleMessageReaction(m.reactions, emoji, currentUser.id),
          };
        }
        return m;
      }),
    });
  },

  addReaction: (messageId: string, emoji: string, userId?: string) => {
    const { currentUser, messages } = get();
    const targetUserId = userId || currentUser.id;
    soundEffects.playReactionPop();
    set({
      messages: messages.map((m) => {
        if (m.id === messageId) {
          const res = addMessageReaction(m.reactions, emoji, targetUserId);
          return res.added ? { ...m, reactions: res.reactions } : m;
        }
        return m;
      }),
    });
  },

  removeReaction: (messageId: string, emoji: string, userId?: string) => {
    const { currentUser, messages } = get();
    const targetUserId = userId || currentUser.id;
    set({
      messages: messages.map((m) => {
        if (m.id === messageId) {
          const res = removeMessageReaction(m.reactions, emoji, targetUserId);
          return res.removed ? { ...m, reactions: res.reactions } : m;
        }
        return m;
      }),
    });
  },

  openThread: (messageId: string) => {
    set({ activeThreadMessageId: messageId });
  },

  closeThread: () => {
    set({ activeThreadMessageId: null });
  },

  sendThreadReply: (messageId: string, content: string) => {
    const { currentUser, messages, threadReplies } = get();
    const rootMessage = messages.find((m) => m.id === messageId);
    if (!rootMessage) return;

    const newReply: ThreadReply = {
      id: `tr-${Date.now()}`,
      messageId,
      userId: currentUser.id,
      content,
      createdAt: new Date().toISOString(),
      reactions: [],
    };

    const currentReplies = threadReplies[messageId] || [];
    const updatedMetrics = calculateThreadMetrics(rootMessage, currentUser.id);

    set({
      threadReplies: {
        ...threadReplies,
        [messageId]: [...currentReplies, newReply],
      },
      messages: messages.map((m) =>
        m.id === messageId ? { ...m, ...updatedMetrics } : m
      ),
    });

    soundEffects.playMessageChime();
  },

  toggleThreadReaction: (replyId: string, emoji: string) => {
    const { currentUser, threadReplies, activeThreadMessageId } = get();
    if (!activeThreadMessageId) return;

    soundEffects.playReactionPop();
    const currentReplies = threadReplies[activeThreadMessageId] || [];
    const updated = currentReplies.map((r) => {
      if (r.id === replyId) {
        return {
          ...r,
          reactions: toggleMessageReaction(r.reactions, emoji, currentUser.id),
        };
      }
      return r;
    });

    set({
      threadReplies: {
        ...threadReplies,
        [activeThreadMessageId]: updated,
      },
    });
  },

  createChannel: (name: string, description: string, topic: string, isPrivate: boolean) => {
    const { currentUser, activeWorkspaceId, channels } = get();
    const cleanName = name.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const newChan: Channel = {
      id: `ch-${Date.now()}`,
      workspaceId: activeWorkspaceId,
      name: cleanName,
      description,
      topic,
      isPrivate,
      memberIds: [currentUser.id, 'user-alex', 'user-elena'],
      unreadCount: 0,
      createdById: currentUser.id,
      createdAt: new Date().toISOString(),
    };

    set({
      channels: [...channels, newChan],
      activeChannelId: newChan.id,
      isCreateChannelOpen: false,
    });
  },

  switchCurrentUser: (userId: string) => {
    const { users } = get();
    const target = users.find((u) => u.id === userId);
    if (target) {
      set({ currentUser: target });
    }
  },

  updateUserPresence: (presence: UserPresence, customStatus?: string) => {
    const { currentUser, users, redisPresenceMap } = get();
    const updated = {
      ...currentUser,
      presence,
      customStatus: customStatus !== undefined ? customStatus : currentUser.customStatus,
    };

    const updatedRedis = {
      ...redisPresenceMap,
      [currentUser.id]: {
        status: presence,
        lastSeen: Date.now(),
        socketCount: presence === 'offline' ? 0 : 2,
      },
    };

    set({
      currentUser: updated,
      users: users.map((u) => (u.id === currentUser.id ? updated : u)),
      redisPresenceMap: updatedRedis,
    });
  },

  recordUserActivity: () => {
    const { currentUser, users, redisPresenceMap } = get();
    const now = Date.now();
    if (currentUser.presence === 'away') {
      const updated = { ...currentUser, presence: 'online' as UserPresence };
      const updatedRedis = {
        ...redisPresenceMap,
        [currentUser.id]: { status: 'online' as UserPresence, lastSeen: now, socketCount: 2 },
      };
      set({
        lastActivityTimestamp: now,
        currentUser: updated,
        users: users.map((u) => (u.id === currentUser.id ? updated : u)),
        redisPresenceMap: updatedRedis,
      });
    } else {
      set({ lastActivityTimestamp: now });
    }
  },

  checkInactivityTimer: () => {
    const { currentUser, users, lastActivityTimestamp, redisPresenceMap } = get();
    const now = Date.now();
    // 45 seconds of idle inactivity triggers 'away' status
    if (currentUser.presence === 'online' && now - lastActivityTimestamp > 45000) {
      const updated = { ...currentUser, presence: 'away' as UserPresence };
      const updatedRedis = {
        ...redisPresenceMap,
        [currentUser.id]: { status: 'away' as UserPresence, lastSeen: now, socketCount: 2 },
      };
      set({
        currentUser: updated,
        users: users.map((u) => (u.id === currentUser.id ? updated : u)),
        redisPresenceMap: updatedRedis,
      });
    }
  },

  setPresenceInspectorOpen: (isPresenceInspectorOpen: boolean) => {
    set({ isPresenceInspectorOpen });
  },

  setTyping: (channelId: string, userName: string, isTyping: boolean) => {
    const { typingUsers } = get();
    const current = typingUsers[channelId] || [];
    let updated: string[];

    if (isTyping) {
      updated = current.includes(userName) ? current : [...current, userName];
    } else {
      updated = current.filter((n) => n !== userName);
    }

    set({
      typingUsers: {
        ...typingUsers,
        [channelId]: updated,
      },
    });
  },

  startHuddle: (channelId: string) => {
    const { currentUser, channels, users } = get();
    const channel = channels.find((c) => c.id === channelId);
    soundEffects.playHuddleJoin();
    set({
      activeHuddle: {
        channelId,
        channelName: channel ? channel.name : 'Direct Conversation',
        participants: [currentUser, users[1]], // Alex joins automatically
        isMuted: false,
        isScreenSharing: false,
        durationSeconds: 0,
      },
    });
  },

  toggleHuddleMute: () => {
    const { activeHuddle } = get();
    if (activeHuddle) {
      set({
        activeHuddle: {
          ...activeHuddle,
          isMuted: !activeHuddle.isMuted,
        },
      });
    }
  },

  toggleHuddleScreenshare: () => {
    const { activeHuddle } = get();
    if (activeHuddle) {
      set({
        activeHuddle: {
          ...activeHuddle,
          isScreenSharing: !activeHuddle.isScreenSharing,
        },
      });
    }
  },

  endHuddle: () => {
    set({ activeHuddle: null });
  },

  setTheme: (theme: AppTheme) => {
    set({ theme });
  },

  setSearchOpen: (isSearchOpen: boolean) => {
    set({ isSearchOpen });
  },

  setCreateChannelOpen: (isCreateChannelOpen: boolean) => {
    set({ isCreateChannelOpen });
  },

  setProfileOpen: (isProfileOpen: boolean) => {
    set({ isProfileOpen });
  },

  setArchitectureOpen: (isArchitectureOpen: boolean) => {
    set({ isArchitectureOpen });
  },

  setMobileSidebarOpen: (isMobileSidebarOpen: boolean) => {
    set({ isMobileSidebarOpen });
  },

  setSoundEnabled: (soundEnabled: boolean) => {
    soundEffects.enabled = soundEnabled;
    set({ soundEnabled });
  },

  dismissToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  simulateColleagueMessage: (scenario = 'benchmarks') => {
    const { activeChannelId, channels, users, messages, setTyping } = get();
    const alex = users[1]; // Alex Chen
    const targetChannel = channels.find((c) => c.id === activeChannelId) || channels[1];

    // Trigger typing indicator first
    setTyping(targetChannel.id, alex.name, true);

    setTimeout(() => {
      setTyping(targetChannel.id, alex.name, false);

      let text = '⚡ Redis 7.2 cluster failover benchmark just completed: 0 dropped packets across 50,000 WebSocket connections!';
      if (scenario === 'incident') {
        text = '🛡️ Celery Beat automated task successfully pruned 1,420 expired JWT tokens in 12ms.';
      } else if (scenario === 'design') {
        text = '🎨 Checked the CSS contrast ratios for the new Midnight and Aubergine themes — 100% WCAG AAA compliant!';
      }

      const incomingMsg: Message = {
        id: `msg-${Date.now()}`,
        channelId: targetChannel.id,
        userId: alex.id,
        content: text,
        createdAt: new Date().toISOString(),
        reactions: [{ emoji: '🔥', count: 1, users: [alex.id] }],
        replyCount: 0,
      };

      const newToast: ToastAlert = {
        id: `toast-${Date.now()}`,
        authorName: alex.name,
        channelName: targetChannel.name,
        content: text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        channelId: targetChannel.id,
      };

      set((state) => ({
        messages: [...state.messages, incomingMsg],
        toasts: [...state.toasts.slice(-2), newToast],
      }));

      soundEffects.playMessageChime();
    }, 1800);
  },

  setActiveNav: (nav: NavSection) => {
    set({ activeNav: nav });
  },

  setQuickCreateOpen: (open: boolean) => {
    set({ isQuickCreateOpen: open });
  },

  createCalendarEvent: (eventData) => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: `evt-${Date.now()}`,
    };
    set((state) => ({
      calendarEvents: [...state.calendarEvents, newEvent],
    }));
    soundEffects.playMessageChime();
  },

  updateCalendarEvent: (id, updates) => {
    set((state) => ({
      calendarEvents: state.calendarEvents.map((ev) =>
        ev.id === id ? { ...ev, ...updates } : ev
      ),
    }));
  },

  deleteCalendarEvent: (id) => {
    set((state) => ({
      calendarEvents: state.calendarEvents.filter((ev) => ev.id !== id),
    }));
  },

  scheduleMeeting: (meetingData) => {
    const { link } = generateMeetingCode();
    const newMeeting: Meeting = {
      ...meetingData,
      id: `meet-${Date.now()}`,
      status: 'scheduled',
      meetingLink: link,
      chatMessages: [],
    };
    set((state) => ({
      meetings: [...state.meetings, newMeeting],
      calendarEvents: [
        ...state.calendarEvents,
        {
          id: `evt-m-${newMeeting.id}`,
          title: newMeeting.title,
          description: newMeeting.description || 'CollabFlow Video Meeting',
          startDate: newMeeting.scheduledAt.split('T')[0],
          startTime: new Date(newMeeting.scheduledAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }),
          endDate: newMeeting.scheduledAt.split('T')[0],
          endTime: new Date(
            new Date(newMeeting.scheduledAt).getTime() + newMeeting.durationMinutes * 60000
          ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
          allDay: false,
          location: 'CollabFlow Video Meeting',
          meetingId: newMeeting.id,
          attendees: newMeeting.participantIds,
          reminderMinutes: 10,
          category: 'meeting',
          color: '#6366f1',
        },
      ],
    }));
    soundEffects.playMessageChime();
  },

  startInstantMeeting: (title = 'Instant Ad-hoc Sync') => {
    const { link } = generateMeetingCode();
    const currentUser = get().currentUser;
    const newMeeting: Meeting = {
      id: `meet-${Date.now()}`,
      title,
      description: 'Instant meeting started from CollabFlow quick actions',
      scheduledAt: new Date().toISOString(),
      durationMinutes: 30,
      hostId: currentUser.id,
      participantIds: [currentUser.id],
      status: 'live',
      meetingLink: link,
      isInstant: true,
      chatMessages: [],
    };
    set((state) => ({
      meetings: [newMeeting, ...state.meetings],
      activeMeeting: newMeeting,
      isInMeetingRoom: true,
      activeNav: 'meetings',
    }));
    soundEffects.playJoinChime();
    return newMeeting;
  },

  joinMeeting: (meetingId) => {
    const meeting = get().meetings.find((m) => m.id === meetingId);
    if (!meeting) return;
    set({
      activeMeeting: meeting,
      isInMeetingRoom: true,
      activeNav: 'meetings',
    });
    soundEffects.playJoinChime();
  },

  leaveMeeting: () => {
    soundEffects.playLeaveChime();
    set({
      isInMeetingRoom: false,
      meetingMediaState: {
        isMuted: false,
        isCameraOff: false,
        isScreenSharing: false,
        isHandRaised: false,
      },
    });
  },

  toggleMeetingMic: () => {
    set((state) => ({
      meetingMediaState: {
        ...state.meetingMediaState,
        isMuted: !state.meetingMediaState.isMuted,
      },
    }));
  },

  toggleMeetingCamera: () => {
    set((state) => ({
      meetingMediaState: {
        ...state.meetingMediaState,
        isCameraOff: !state.meetingMediaState.isCameraOff,
      },
    }));
  },

  toggleMeetingScreenShare: () => {
    set((state) => ({
      meetingMediaState: {
        ...state.meetingMediaState,
        isScreenSharing: !state.meetingMediaState.isScreenSharing,
      },
    }));
  },

  toggleMeetingHandRaise: () => {
    set((state) => ({
      meetingMediaState: {
        ...state.meetingMediaState,
        isHandRaised: !state.meetingMediaState.isHandRaised,
      },
    }));
  },

  sendMeetingChatMessage: (meetingId, content) => {
    const currentUser = get().currentUser;
    const newChat = {
      id: `mc-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    set((state) => ({
      meetings: state.meetings.map((m) =>
        m.id === meetingId
          ? { ...m, chatMessages: [...(m.chatMessages || []), newChat] }
          : m
      ),
      activeMeeting:
        state.activeMeeting?.id === meetingId
          ? {
              ...state.activeMeeting,
              chatMessages: [...(state.activeMeeting.chatMessages || []), newChat],
            }
          : state.activeMeeting,
    }));
  },

  createTask: (taskData) => {
    const newTask: Task = {
      ...taskData,
      id: `tsk-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      commentsCount: 0,
    };
    set((state) => ({
      tasks: [newTask, ...state.tasks],
    }));
    soundEffects.playMessageChime();

    if (get().backendConnected) {
      apiClient.tasks.create({
        title: newTask.title,
        description: newTask.description,
        status: newTask.status,
        priority: newTask.priority,
        due_date: newTask.dueDate,
        workspace: get().activeWorkspaceId,
      }).catch(() => {});
    }
  },

  updateTask: (id, updates) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));

    if (get().backendConnected) {
      apiClient.tasks.update(id, updates).catch(() => {});
    }
  },

  updateTaskStatus: (id, status) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
    }));

    if (get().backendConnected) {
      apiClient.tasks.update(id, { status }).catch(() => {});
    }
  },

  toggleSubtask: (taskId, subtaskId) => {
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          subtasks: t.subtasks.map((st) =>
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          ),
        };
      }),
    }));
  },

  deleteTask: (id) => {
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    }));

    if (get().backendConnected) {
      apiClient.tasks.delete(id).catch(() => {});
    }
  },

  createReminder: (reminderData) => {
    const newReminder: Reminder = {
      ...reminderData,
      id: `rem-${Date.now()}`,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      reminders: [newReminder, ...state.reminders],
    }));
    soundEffects.playMessageChime();
  },

  toggleReminderComplete: (id) => {
    set((state) => ({
      reminders: state.reminders.map((r) =>
        r.id === id ? { ...r, completed: !r.completed } : r
      ),
    }));
  },

  snoozeReminder: (id, minutes) => {
    const snoozeTime = new Date(Date.now() + minutes * 60000).toISOString();
    set((state) => ({
      reminders: state.reminders.map((r) =>
        r.id === id ? { ...r, snoozeUntil: snoozeTime, dueAt: snoozeTime } : r
      ),
    }));
  },

  deleteReminder: (id) => {
    set((state) => ({
      reminders: state.reminders.filter((r) => r.id !== id),
    }));
  },

  markNotificationRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  },

  markAllNotificationsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },

  clearNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  uploadWorkspaceFile: (fileData) => {
    const newFile: WorkspaceFile = {
      ...fileData,
      id: `file-${Date.now()}`,
      uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    set((state) => ({
      workspaceFiles: [newFile, ...state.workspaceFiles],
    }));
    soundEffects.playMessageChime();
  },

  deleteWorkspaceFile: (id) => {
    set((state) => ({
      workspaceFiles: state.workspaceFiles.filter((f) => f.id !== id),
    }));
  },
}));

// Initialize client-side socket event handlers and check backend health
if (typeof window !== 'undefined') {
  if (import.meta.env.VITE_API_URL) {
    setTimeout(() => {
      useCollabStore.getState().checkBackendHealth().catch(() => {});
    }, 100);
  }

  socketManager.subscribe('chat.message', (payload: any) => {
    if (payload && payload.id) {
      const state = useCollabStore.getState();
      const exists = state.messages.some((m) => m.id === payload.id);
      if (!exists) {
        useCollabStore.setState({
          messages: [...state.messages, payload],
        });
        soundEffects.playMessageChime();
      }
    }
  });

  socketManager.subscribe('presence.update', (payload: any) => {
    if (payload && payload.userId && payload.presence) {
      const state = useCollabStore.getState();
      useCollabStore.setState({
        users: state.users.map((u) =>
          u.id === payload.userId ? { ...u, presence: payload.presence } : u
        ),
      });
    }
  });
}
