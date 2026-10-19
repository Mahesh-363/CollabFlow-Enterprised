import type { Message, Reaction, User, UserRole, Channel, ThreadReply, UserPresence } from '../types/collab.ts';

/**
 * Checks if a user has permission to delete a message.
 * Owners and Admins can delete any message; Members and Guests can only delete their own.
 */
export function canDeleteMessage(user: User, message: Message): boolean {
  if (user.role === 'owner' || user.role === 'admin') {
    return true;
  }
  return user.id === message.userId && user.role !== 'guest';
}

/**
 * Checks if a user has permission to edit a message.
 * Users can only edit their own messages.
 */
export function canEditMessage(user: User, message: Message): boolean {
  return user.id === message.userId && !message.isDeleted;
}

/**
 * Checks if a user has permission to create channels.
 * Guests cannot create channels.
 */
export function canCreateChannel(user: User): boolean {
  return user.role !== 'guest';
}

/**
 * Validates and sanitizes a channel name.
 * Checks for non-empty alphanumeric string and uniqueness within the workspace.
 */
export function validateChannelName(
  name: string,
  existingChannels: Channel[],
  workspaceId: string
): { isValid: boolean; cleanName: string; error?: string } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { isValid: false, cleanName: '', error: 'Channel name is required.' };
  }

  const cleanName = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!cleanName) {
    return {
      isValid: false,
      cleanName: '',
      error: 'Channel name must contain alphanumeric characters.',
    };
  }

  const isDuplicate = existingChannels.some(
    (c) => c.workspaceId === workspaceId && c.name.toLowerCase() === cleanName
  );

  if (isDuplicate) {
    return {
      isValid: false,
      cleanName,
      error: `A channel named "#${cleanName}" already exists in this workspace.`,
    };
  }

  return { isValid: true, cleanName };
}

/**
 * Checks if a user can access a channel (private channels require membership).
 */
export function canAccessChannel(user: User, channel: Channel): boolean {
  if (user.role === 'owner' || user.role === 'admin') {
    return true;
  }
  if (!channel.isPrivate) {
    return true;
  }
  return channel.memberIds.includes(user.id);
}

/**
 * Toggles an emoji reaction on a message for a given user.
 * If the user already reacted with this emoji, removes them.
 * If no users remain for this emoji, removes the reaction object entirely.
 * Otherwise adds the user and increments count.
 */
export function toggleMessageReaction(
  reactions: Reaction[],
  emoji: string,
  userId: string
): Reaction[] {
  const existingIdx = reactions.findIndex((r) => r.emoji === emoji);

  if (existingIdx === -1) {
    // Add new reaction
    return [...reactions, { emoji, count: 1, users: [userId] }];
  }

  const existing = reactions[existingIdx];
  const userHasReacted = existing.users.includes(userId);

  if (userHasReacted) {
    // Remove reaction
    const updatedUsers = existing.users.filter((id) => id !== userId);
    if (updatedUsers.length === 0) {
      return reactions.filter((_, idx) => idx !== existingIdx);
    }
    const updatedReactions = [...reactions];
    updatedReactions[existingIdx] = {
      ...existing,
      count: updatedUsers.length,
      users: updatedUsers,
    };
    return updatedReactions;
  } else {
    // Add user to existing reaction
    const updatedUsers = [...existing.users, userId];
    const updatedReactions = [...reactions];
    updatedReactions[existingIdx] = {
      ...existing,
      count: updatedUsers.length,
      users: updatedUsers,
    };
    return updatedReactions;
  }
}

/**
 * Explicitly adds an emoji reaction if not already present.
 */
export function addMessageReaction(
  reactions: Reaction[],
  emoji: string,
  userId: string
): { reactions: Reaction[]; added: boolean } {
  const existingIdx = reactions.findIndex((r) => r.emoji === emoji);

  if (existingIdx === -1) {
    return {
      reactions: [...reactions, { emoji, count: 1, users: [userId] }],
      added: true,
    };
  }

  const existing = reactions[existingIdx];
  if (existing.users.includes(userId)) {
    return { reactions, added: false };
  }

  const updatedReactions = [...reactions];
  updatedReactions[existingIdx] = {
    ...existing,
    count: existing.count + 1,
    users: [...existing.users, userId],
  };
  return { reactions: updatedReactions, added: true };
}

/**
 * Explicitly removes an emoji reaction if present.
 */
export function removeMessageReaction(
  reactions: Reaction[],
  emoji: string,
  userId: string
): { reactions: Reaction[]; removed: boolean } {
  const existingIdx = reactions.findIndex((r) => r.emoji === emoji);
  if (existingIdx === -1) {
    return { reactions, removed: false };
  }

  const existing = reactions[existingIdx];
  if (!existing.users.includes(userId)) {
    return { reactions, removed: false };
  }

  const updatedUsers = existing.users.filter((id) => id !== userId);
  if (updatedUsers.length === 0) {
    return {
      reactions: reactions.filter((_, idx) => idx !== existingIdx),
      removed: true,
    };
  }

  const updatedReactions = [...reactions];
  updatedReactions[existingIdx] = {
    ...existing,
    count: updatedUsers.length,
    users: updatedUsers,
  };
  return { reactions: updatedReactions, removed: true };
}

/**
 * Serializes reactions for DRF message serializer response, tagging has_reacted for the requesting user.
 */
export function serializeMessageReactions(
  reactions: Reaction[],
  currentUserId: string
): Array<{ emoji: string; count: number; users: string[]; hasReacted: boolean }> {
  return reactions.map((r) => ({
    emoji: r.emoji,
    count: r.count,
    users: r.users,
    hasReacted: r.users.includes(currentUserId),
  }));
}

/**
 * REDIS USER PRESENCE TRACKING
 * Format Redis key for storing user status
 */
export function formatRedisPresenceKey(userId: string): string {
  return `presence:user:${userId}`;
}

export function formatRedisConnectionSetKey(userId: string): string {
  return `presence:connections:${userId}`;
}

/**
 * Inactivity presence calculation.
 * If user hasn't sent a heartbeat within idleThresholdMs, transitions to 'away'.
 * If offline or manual DND, respects explicit states.
 */
export function calculatePresenceFromInactivity(
  lastActivityTimestamp: number,
  currentTimestamp: number,
  idleThresholdMs: number = 60000, // 60s default
  manualStatus?: UserPresence
): UserPresence {
  if (manualStatus === 'dnd' || manualStatus === 'offline') {
    return manualStatus;
  }

  const elapsed = currentTimestamp - lastActivityTimestamp;
  if (elapsed >= idleThresholdMs) {
    return 'away';
  }
  return 'online';
}

/**
 * Redis Multi-Tab Connection Tracker
 * Ensures user is only marked 'offline' when ALL active WebSocket connections terminate.
 */
export interface RedisUserPresenceRecord {
  socketIds: string[];
  lastSeen: number;
  status: UserPresence;
}

export function updateRedisPresenceRecord(
  currentRecord: RedisUserPresenceRecord | undefined,
  action: 'connect' | 'disconnect' | 'heartbeat' | 'idle',
  socketId: string,
  timestamp: number = Date.now()
): { updatedRecord: RedisUserPresenceRecord; resultingStatus: UserPresence } {
  const existingSockets = currentRecord ? [...currentRecord.socketIds] : [];
  let status: UserPresence = currentRecord?.status || 'offline';

  if (action === 'connect') {
    if (!existingSockets.includes(socketId)) {
      existingSockets.push(socketId);
    }
    status = 'online';
  } else if (action === 'disconnect') {
    const remainingSockets = existingSockets.filter((id) => id !== socketId);
    if (remainingSockets.length === 0) {
      status = 'offline';
      return {
        updatedRecord: { socketIds: [], lastSeen: timestamp, status: 'offline' },
        resultingStatus: 'offline',
      };
    }
    return {
      updatedRecord: { socketIds: remainingSockets, lastSeen: timestamp, status },
      resultingStatus: status,
    };
  } else if (action === 'heartbeat') {
    status = 'online';
  } else if (action === 'idle') {
    status = existingSockets.length > 0 ? 'away' : 'offline';
  }

  return {
    updatedRecord: {
      socketIds: existingSockets,
      lastSeen: timestamp,
      status,
    },
    resultingStatus: status,
  };
}

/**
 * Full-text search over a list of messages.
 * Matches content, attachments, and user names.
 */
export function searchMessages(
  messages: Message[],
  usersMap: Record<string, User>,
  channelsMap: Record<string, Channel>,
  query: string,
  filterChannelId?: string,
  filterUserId?: string
): Message[] {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery && !filterChannelId && !filterUserId) {
    return [];
  }

  return messages.filter((msg) => {
    if (msg.isDeleted) return false;
    if (filterChannelId && msg.channelId !== filterChannelId) return false;
    if (filterUserId && msg.userId !== filterUserId) return false;

    if (!cleanQuery) return true;

    // Content match
    if (msg.content.toLowerCase().includes(cleanQuery)) return true;

    // Author name match
    const author = usersMap[msg.userId];
    if (author && author.name.toLowerCase().includes(cleanQuery)) return true;

    // Channel name match
    const channel = channelsMap[msg.channelId];
    if (channel && channel.name.toLowerCase().includes(cleanQuery)) return true;

    // Attachment match
    if (msg.attachments && msg.attachments.some((att) => att.name.toLowerCase().includes(cleanQuery))) {
      return true;
    }

    return false;
  });
}

/**
 * Calculates updated thread metrics on root message when a new reply is added.
 */
export function calculateThreadMetrics(
  rootMessage: Message,
  newReplyUserId: string
): { replyCount: number; lastReplyAt: string; threadParticipantIds: string[] } {
  const participants = new Set(rootMessage.threadParticipantIds || []);
  participants.add(rootMessage.userId);
  participants.add(newReplyUserId);

  return {
    replyCount: (rootMessage.replyCount || 0) + 1,
    lastReplyAt: new Date().toISOString(),
    threadParticipantIds: Array.from(participants),
  };
}

/**
 * Format relative or exact message timestamp.
 */
export function formatMessageTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '12:00 PM';
  }
}

/**
 * Format date divider heading (e.g., Today, Yesterday, or October 15, 2026).
 */
export function formatDateDivider(isoString: string, now: Date = new Date()): string {
  try {
    const date = new Date(isoString);
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) return 'Today';

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) return 'Yesterday';

    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Today';
  }
}
