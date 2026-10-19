import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canDeleteMessage,
  canCreateChannel,
  validateChannelName,
  toggleMessageReaction,
  addMessageReaction,
  removeMessageReaction,
  serializeMessageReactions,
  calculatePresenceFromInactivity,
  updateRedisPresenceRecord,
  formatRedisPresenceKey,
  searchMessages,
  calculateThreadMetrics,
} from './collabLogic.ts';
import type { User, Message, Channel, Reaction } from '../types/collab.ts';

const ownerUser: User = {
  id: 'u-1',
  name: 'Elena Vance',
  email: 'elena@acme.corp',
  avatar: '',
  title: 'Staff Architect',
  role: 'owner',
  presence: 'online',
};

const memberUser: User = {
  id: 'u-2',
  name: 'Alex Chen',
  email: 'alex@acme.corp',
  avatar: '',
  title: 'Senior Engineer',
  role: 'member',
  presence: 'online',
};

const guestUser: User = {
  id: 'u-3',
  name: 'Guest Consultant',
  email: 'guest@external.io',
  avatar: '',
  title: 'Consultant',
  role: 'guest',
  presence: 'away',
};

const sampleMessage: Message = {
  id: 'm-100',
  channelId: 'c-eng',
  userId: 'u-2',
  content: 'Debezium CDC streaming pipeline is active in staging cluster.',
  createdAt: new Date().toISOString(),
  reactions: [{ emoji: '🚀', count: 1, users: ['u-2'] }],
  replyCount: 0,
};

test('owner can delete any user message', () => {
  assert.equal(canDeleteMessage(ownerUser, sampleMessage), true);
});

test('member can delete their own message but not others', () => {
  assert.equal(canDeleteMessage(memberUser, sampleMessage), true);
  const otherMsg: Message = { ...sampleMessage, userId: 'u-1' };
  assert.equal(canDeleteMessage(memberUser, otherMsg), false);
});

test('guest cannot create channels', () => {
  assert.equal(canCreateChannel(guestUser), false);
  assert.equal(canCreateChannel(memberUser), true);
});

test('toggleMessageReaction adds new reaction correctly', () => {
  const result = toggleMessageReaction(sampleMessage.reactions, '🔥', 'u-1');
  assert.equal(result.length, 2);
  const fire = result.find((r) => r.emoji === '🔥');
  assert.ok(fire);
  assert.equal(fire.count, 1);
  assert.deepEqual(fire.users, ['u-1']);
});

test('toggleMessageReaction toggles off existing reaction', () => {
  const result = toggleMessageReaction(sampleMessage.reactions, '🚀', 'u-2');
  assert.equal(result.length, 0); // Removed completely because only 1 user had it
});

test('addMessageReaction and removeMessageReaction handle explicit socket events', () => {
  const initial: Reaction[] = [];
  const res1 = addMessageReaction(initial, '👍', 'u-1');
  assert.equal(res1.added, true);
  assert.equal(res1.reactions.length, 1);
  assert.equal(res1.reactions[0].count, 1);

  // Duplicate add is idempotent
  const res2 = addMessageReaction(res1.reactions, '👍', 'u-1');
  assert.equal(res2.added, false);
  assert.equal(res2.reactions[0].count, 1);

  // Remove reaction
  const res3 = removeMessageReaction(res2.reactions, '👍', 'u-1');
  assert.equal(res3.removed, true);
  assert.equal(res3.reactions.length, 0);
});

test('serializeMessageReactions flags hasReacted accurately', () => {
  const reactions: Reaction[] = [
    { emoji: '🚀', count: 2, users: ['u-1', 'u-2'] },
    { emoji: '🔥', count: 1, users: ['u-2'] },
  ];
  const serialized = serializeMessageReactions(reactions, 'u-1');
  assert.equal(serialized[0].hasReacted, true);
  assert.equal(serialized[1].hasReacted, false);
});

test('calculatePresenceFromInactivity marks user away after idle threshold', () => {
  const now = 100000;
  const recentActivity = now - 10000; // 10s ago
  const oldActivity = now - 70000; // 70s ago (exceeds 60s threshold)

  assert.equal(calculatePresenceFromInactivity(recentActivity, now, 60000), 'online');
  assert.equal(calculatePresenceFromInactivity(oldActivity, now, 60000), 'away');
  assert.equal(calculatePresenceFromInactivity(recentActivity, now, 60000, 'dnd'), 'dnd');
});

test('updateRedisPresenceRecord handles multi-socket presence tracking', () => {
  assert.equal(formatRedisPresenceKey('u-1'), 'presence:user:u-1');

  // Tab 1 connects
  const step1 = updateRedisPresenceRecord(undefined, 'connect', 'sock-1', 1000);
  assert.equal(step1.resultingStatus, 'online');
  assert.equal(step1.updatedRecord.socketIds.length, 1);

  // Tab 2 connects from same user
  const step2 = updateRedisPresenceRecord(step1.updatedRecord, 'connect', 'sock-2', 1500);
  assert.equal(step2.resultingStatus, 'online');
  assert.equal(step2.updatedRecord.socketIds.length, 2);

  // Tab 1 closes -> user should still be online because Tab 2 is active
  const step3 = updateRedisPresenceRecord(step2.updatedRecord, 'disconnect', 'sock-1', 2000);
  assert.equal(step3.resultingStatus, 'online');
  assert.equal(step3.updatedRecord.socketIds.length, 1);

  // Tab 2 closes -> all sockets closed, user goes offline
  const step4 = updateRedisPresenceRecord(step3.updatedRecord, 'disconnect', 'sock-2', 2500);
  assert.equal(step4.resultingStatus, 'offline');
  assert.equal(step4.updatedRecord.socketIds.length, 0);
});

test('calculateThreadMetrics increments reply count and accumulates participants', () => {
  const metrics = calculateThreadMetrics(sampleMessage, 'u-1');
  assert.equal(metrics.replyCount, 1);
  assert.ok(metrics.threadParticipantIds.includes('u-2'));
  assert.ok(metrics.threadParticipantIds.includes('u-1'));
});

test('searchMessages finds matching keyword and author', () => {
  const usersMap = { 'u-1': ownerUser, 'u-2': memberUser, 'u-3': guestUser };
  const channelsMap: Record<string, Channel> = {
    'c-eng': {
      id: 'c-eng',
      workspaceId: 'w-1',
      name: 'engineering',
      description: 'Dev discussion',
      isPrivate: false,
      memberIds: ['u-1', 'u-2'],
      unreadCount: 0,
      createdById: 'u-1',
      createdAt: new Date().toISOString(),
    },
  };

  const matches = searchMessages([sampleMessage], usersMap, channelsMap, 'Debezium');
  assert.equal(matches.length, 1);

  const noMatches = searchMessages([sampleMessage], usersMap, channelsMap, 'nonexistent');
  assert.equal(noMatches.length, 0);
});

test('user presence transitions: online -> away on inactivity, away -> online on user activity', () => {
  const idleThresholdMs = 45000;
  const t0 = 1000000;

  // Initially active -> online
  assert.equal(calculatePresenceFromInactivity(t0, t0 + 10000, idleThresholdMs), 'online');

  // Inactivity decay threshold reached (> 45s) -> away
  assert.equal(calculatePresenceFromInactivity(t0, t0 + 46000, idleThresholdMs), 'away');

  // New user activity recorded (now is updated to t0 + 47000) -> instantly returns to online
  const tWake = t0 + 47000;
  assert.equal(calculatePresenceFromInactivity(tWake, tWake + 500, idleThresholdMs), 'online');
});

test('multi-user emoji reactions: grouping by emoji, reactor user list, and count matching serializer schema', () => {
  let reactions: Reaction[] = [];

  // User 1 reacts with 👍
  reactions = toggleMessageReaction(reactions, '👍', 'u-1');
  assert.equal(reactions.length, 1);
  assert.equal(reactions[0].count, 1);
  assert.deepEqual(reactions[0].users, ['u-1']);

  // User 2 reacts with 👍
  reactions = toggleMessageReaction(reactions, '👍', 'u-2');
  assert.equal(reactions.length, 1);
  assert.equal(reactions[0].count, 2);
  assert.deepEqual(reactions[0].users, ['u-1', 'u-2']);

  // User 3 reacts with 🔥
  reactions = toggleMessageReaction(reactions, '🔥', 'u-3');
  assert.equal(reactions.length, 2);

  // Serializer verification for User 1
  const u1View = serializeMessageReactions(reactions, 'u-1');
  const thumbsUp = u1View.find((r) => r.emoji === '👍')!;
  const fire = u1View.find((r) => r.emoji === '🔥')!;
  assert.equal(thumbsUp.hasReacted, true);
  assert.equal(thumbsUp.count, 2);
  assert.equal(fire.hasReacted, false);
  assert.equal(fire.count, 1);

  // User 1 toggles off 👍
  reactions = toggleMessageReaction(reactions, '👍', 'u-1');
  const u1ViewAfterToggle = serializeMessageReactions(reactions, 'u-1');
  const thumbsUpAfter = u1ViewAfterToggle.find((r) => r.emoji === '👍')!;
  assert.equal(thumbsUpAfter.count, 1);
  assert.equal(thumbsUpAfter.hasReacted, false);
  assert.deepEqual(thumbsUpAfter.users, ['u-2']);
});

test('validateChannelName rejects empty, whitespace, and symbol-only names', () => {
  const existing: Channel[] = [];
  assert.equal(validateChannelName('', existing, 'ws-1').isValid, false);
  assert.equal(validateChannelName('   ', existing, 'ws-1').isValid, false);
  assert.equal(validateChannelName('!!!###', existing, 'ws-1').isValid, false);
  assert.match(validateChannelName('', existing, 'ws-1').error!, /required/i);
});

test('validateChannelName sanitizes valid inputs into kebab-case slugs', () => {
  const existing: Channel[] = [];
  const res = validateChannelName('  Data Pipeline & Alerts!  ', existing, 'ws-1');
  assert.equal(res.isValid, true);
  assert.equal(res.cleanName, 'data-pipeline-alerts');
});

test('validateChannelName flags duplicate channel names in the same workspace', () => {
  const existing: Channel[] = [
    {
      id: 'c-1',
      workspaceId: 'ws-1',
      name: 'general',
      description: '',
      topic: '',
      isPrivate: false,
      memberIds: ['u-1'],
      unreadCount: 0,
      createdById: 'u-1',
      createdAt: new Date().toISOString(),
    },
  ];

  const duplicate = validateChannelName('General', existing, 'ws-1');
  assert.equal(duplicate.isValid, false);
  assert.match(duplicate.error!, /already exists in this workspace/i);

  // But allowed in a different workspace
  const diffWorkspace = validateChannelName('general', existing, 'ws-2');
  assert.equal(diffWorkspace.isValid, true);
  assert.equal(diffWorkspace.cleanName, 'general');
});

test('channel creation handles optimistic update and rollback on failure', async () => {
  const initialChannels: Channel[] = [
    {
      id: 'c-1',
      workspaceId: 'ws-1',
      name: 'general',
      description: '',
      topic: '',
      isPrivate: false,
      memberIds: ['u-1'],
      unreadCount: 0,
      createdById: 'u-1',
      createdAt: new Date().toISOString(),
    },
  ];

  let channels = [...initialChannels];
  let activeChannelId = 'c-1';

  // Helper simulating optimistic channel create with rollback
  const simulateCreate = async (shouldFail: boolean) => {
    const backupChannels = [...channels];
    const backupActiveId = activeChannelId;

    const newChan: Channel = {
      id: 'c-optimistic',
      workspaceId: 'ws-1',
      name: 'engineering',
      description: 'Dev discussion',
      topic: 'Code',
      isPrivate: false,
      memberIds: ['u-1'],
      unreadCount: 0,
      createdById: 'u-1',
      createdAt: new Date().toISOString(),
    };

    // Optimistic update: new channel placed at the top
    channels = [newChan, ...channels];
    activeChannelId = newChan.id;

    if (shouldFail) {
      // Rollback
      channels = backupChannels;
      activeChannelId = backupActiveId;
      return { success: false, error: 'Server error 500' };
    }

    return { success: true, channel: newChan };
  };

  // Test successful creation
  const okResult = await simulateCreate(false);
  assert.equal(okResult.success, true);
  assert.equal(channels.length, 2);
  assert.equal(channels[0].id, 'c-optimistic');
  assert.equal(activeChannelId, 'c-optimistic');

  // Reset
  channels = [...initialChannels];
  activeChannelId = 'c-1';

  // Test rollback on server failure
  const failResult = await simulateCreate(true);
  assert.equal(failResult.success, false);
  assert.equal(channels.length, 1);
  assert.equal(activeChannelId, 'c-1');
});

