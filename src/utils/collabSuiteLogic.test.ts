import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterTasks,
  calculateTaskMetrics,
  areTimeIntervalsOverlapping,
  detectCalendarConflicts,
  categorizeReminders,
  aggregateNotifications,
  generateMeetingCode,
  getMeetingTimeStatus,
  generateDailyBrief,
} from './collabSuiteLogic.ts';
import type { Task, CalendarEvent, Reminder, NotificationItem, Meeting } from '../types/collab.ts';

test('filterTasks filters by status, assignee, priority and keyword', () => {
  const sampleTasks: Task[] = [
    {
      id: 't-1',
      title: 'Deploy Kubernetes v1.31 cluster',
      description: 'Upgrade node pools in us-central1',
      status: 'in_progress',
      priority: 'urgent',
      assigneeId: 'user-alex',
      creatorId: 'user-elena',
      dueDate: '2026-10-20',
      tags: ['infrastructure', 'k8s'],
      subtasks: [{ id: 's-1', title: 'Drain nodes', completed: true }],
      commentsCount: 3,
      createdAt: '2026-10-10',
    },
    {
      id: 't-2',
      title: 'Refactor GraphQL resolvers',
      description: 'Optimize N+1 queries with dataloader',
      status: 'todo',
      priority: 'medium',
      assigneeId: 'user-david',
      creatorId: 'user-elena',
      dueDate: '2026-10-25',
      tags: ['backend', 'graphql'],
      subtasks: [],
      commentsCount: 0,
      createdAt: '2026-10-12',
    },
    {
      id: 't-3',
      title: 'Design token migration',
      description: 'Update Tailwind colors for dark mode',
      status: 'done',
      priority: 'low',
      assigneeId: 'user-maya',
      creatorId: 'user-alex',
      dueDate: '2026-10-14',
      tags: ['frontend', 'design'],
      subtasks: [{ id: 's-2', title: 'Export tokens', completed: true }],
      commentsCount: 1,
      createdAt: '2026-10-08',
    },
  ];

  // Filter by status
  const inProgress = filterTasks(sampleTasks, { status: 'in_progress' });
  assert.equal(inProgress.length, 1);
  assert.equal(inProgress[0].id, 't-1');

  // Filter by assignee
  const davidsTasks = filterTasks(sampleTasks, { assigneeId: 'user-david' });
  assert.equal(davidsTasks.length, 1);
  assert.equal(davidsTasks[0].id, 't-2');

  // Filter by search keyword matching tag
  const designTasks = filterTasks(sampleTasks, { search: 'design' });
  assert.equal(designTasks.length, 1);
  assert.equal(designTasks[0].id, 't-3');
});

test('calculateTaskMetrics computes total, completed, and completion rate', () => {
  const sampleTasks: Task[] = [
    {
      id: 't-1',
      title: 'Task 1',
      description: '',
      status: 'done',
      priority: 'high',
      assigneeId: 'u-1',
      creatorId: 'u-1',
      dueDate: '2026-10-15',
      tags: [],
      subtasks: [],
      commentsCount: 0,
      createdAt: '2026-10-01',
    },
    {
      id: 't-2',
      title: 'Task 2',
      description: '',
      status: 'done',
      priority: 'medium',
      assigneeId: 'u-1',
      creatorId: 'u-1',
      dueDate: '2026-10-15',
      tags: [],
      subtasks: [],
      commentsCount: 0,
      createdAt: '2026-10-01',
    },
    {
      id: 't-3',
      title: 'Task 3',
      description: '',
      status: 'in_progress',
      priority: 'high',
      assigneeId: 'u-1',
      creatorId: 'u-1',
      dueDate: '2026-10-20',
      tags: [],
      subtasks: [],
      commentsCount: 0,
      createdAt: '2026-10-01',
    },
    {
      id: 't-4',
      title: 'Task 4',
      description: '',
      status: 'todo',
      priority: 'low',
      assigneeId: 'u-1',
      creatorId: 'u-1',
      dueDate: '2026-10-22',
      tags: [],
      subtasks: [],
      commentsCount: 0,
      createdAt: '2026-10-01',
    },
  ];

  const metrics = calculateTaskMetrics(sampleTasks);
  assert.equal(metrics.total, 4);
  assert.equal(metrics.completed, 2);
  assert.equal(metrics.inProgress, 1);
  assert.equal(metrics.todo, 1);
  assert.equal(metrics.completionRate, 50);
});

test('areTimeIntervalsOverlapping correctly detects time collisions', () => {
  // Overlapping
  assert.equal(
    areTimeIntervalsOverlapping(
      '2026-10-16T10:00:00',
      '2026-10-16T11:00:00',
      '2026-10-16T10:30:00',
      '2026-10-16T11:30:00'
    ),
    true
  );

  // Consecutive (back-to-back, no overlap)
  assert.equal(
    areTimeIntervalsOverlapping(
      '2026-10-16T10:00:00',
      '2026-10-16T11:00:00',
      '2026-10-16T11:00:00',
      '2026-10-16T12:00:00'
    ),
    false
  );

  // Completely disjoint
  assert.equal(
    areTimeIntervalsOverlapping(
      '2026-10-16T09:00:00',
      '2026-10-16T10:00:00',
      '2026-10-16T14:00:00',
      '2026-10-16T15:00:00'
    ),
    false
  );
});

test('detectCalendarConflicts finds overlapping meetings for shared attendees', () => {
  const existingEvents: CalendarEvent[] = [
    {
      id: 'ev-1',
      title: 'Sprint Planning',
      description: '',
      startDate: '2026-10-16',
      startTime: '10:00',
      endDate: '2026-10-16',
      endTime: '11:00',
      attendees: ['user-elena', 'user-alex'],
      reminderMinutes: 10,
      category: 'meeting',
    },
  ];

  const conflictingCandidate: Partial<CalendarEvent> = {
    startDate: '2026-10-16',
    startTime: '10:30',
    endDate: '2026-10-16',
    endTime: '11:30',
    attendees: ['user-alex', 'user-maya'],
  };

  const conflicts = detectCalendarConflicts(existingEvents, conflictingCandidate);
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].id, 'ev-1');

  // Candidate with different attendee and different time
  const nonConflicting: Partial<CalendarEvent> = {
    startDate: '2026-10-16',
    startTime: '14:00',
    endDate: '2026-10-16',
    endTime: '15:00',
    attendees: ['user-alex'],
  };
  const noConflicts = detectCalendarConflicts(existingEvents, nonConflicting);
  assert.equal(noConflicts.length, 0);
});

test('categorizeReminders groups by overdue, today, and upcoming', () => {
  const mockNow = new Date('2026-10-16T12:00:00Z').getTime();

  const sampleReminders: Reminder[] = [
    {
      id: 'r-1',
      title: 'Review PR #412',
      dueAt: '2026-10-14T10:00:00Z', // Past day -> overdue
      priority: 'high',
      completed: false,
      createdAt: '2026-10-13T10:00:00Z',
    },
    {
      id: 'r-2',
      title: 'Standup update',
      dueAt: '2026-10-16T16:00:00Z', // Today
      priority: 'medium',
      completed: false,
      createdAt: '2026-10-16T08:00:00Z',
    },
    {
      id: 'r-3',
      title: 'Quarterly roadmap sync',
      dueAt: '2026-10-20T10:00:00Z', // Future day
      priority: 'low',
      completed: false,
      createdAt: '2026-10-16T08:00:00Z',
    },
    {
      id: 'r-4',
      title: 'Submit expense report',
      dueAt: '2026-10-15T10:00:00Z',
      priority: 'low',
      completed: true, // Completed
      createdAt: '2026-10-14T08:00:00Z',
    },
  ];

  const result = categorizeReminders(sampleReminders, mockNow);
  assert.equal(result.overdue.length, 1);
  assert.equal(result.overdue[0].id, 'r-1');
  assert.equal(result.today.length, 1);
  assert.equal(result.today[0].id, 'r-2');
  assert.equal(result.upcoming.length, 1);
  assert.equal(result.upcoming[0].id, 'r-3');
  assert.equal(result.completed.length, 1);
  assert.equal(result.completed[0].id, 'r-4');
});

test('aggregateNotifications calculates unread count by type', () => {
  const sampleNotifications: NotificationItem[] = [
    {
      id: 'n-1',
      type: 'mention',
      title: 'Mentioned you in #engineering',
      body: 'Can you take a look?',
      createdAt: '2026-10-16T10:00:00Z',
      read: false,
      linkNav: 'chat',
    },
    {
      id: 'n-2',
      type: 'task',
      title: 'Task assigned',
      body: 'Assigned to K8s rollout',
      createdAt: '2026-10-16T10:05:00Z',
      read: false,
      linkNav: 'tasks',
    },
    {
      id: 'n-3',
      type: 'task',
      title: 'Task updated',
      body: 'Status changed to In Review',
      createdAt: '2026-10-16T10:10:00Z',
      read: true,
      linkNav: 'tasks',
    },
  ];

  const agg = aggregateNotifications(sampleNotifications);
  assert.equal(agg.unreadCount, 2);
  assert.equal(agg.byType.mention, 1);
  assert.equal(agg.byType.task, 1);
});

test('generateMeetingCode outputs proper prefix and URL format', () => {
  const result = generateMeetingCode('cf');
  assert.ok(result.code.startsWith('cf-'));
  assert.ok(result.link.includes('https://collabflow.app/meet/cf-'));
});

test('getMeetingTimeStatus reports isJoinable appropriately', () => {
  const now = new Date('2026-10-16T14:00:00Z').getTime();

  const liveMeeting: Meeting = {
    id: 'm-live',
    title: 'Architecture Sync',
    description: '',
    scheduledAt: '2026-10-16T13:55:00Z',
    durationMinutes: 45,
    hostId: 'user-elena',
    participantIds: ['user-elena'],
    status: 'live',
    meetingLink: 'https://collabflow.app/meet/cf-live',
  };
  const liveStatus = getMeetingTimeStatus(liveMeeting, now);
  assert.equal(liveStatus.isJoinable, true);
  assert.equal(liveStatus.statusLabel, 'Live Now');

  const upcomingMeeting: Meeting = {
    id: 'm-up',
    title: 'Design Review',
    description: '',
    scheduledAt: '2026-10-16T14:05:00Z', // 5 minutes in future -> joinable (<= 10 mins)
    durationMinutes: 30,
    hostId: 'user-maya',
    participantIds: ['user-maya'],
    status: 'scheduled',
    meetingLink: 'https://collabflow.app/meet/cf-design',
  };
  const upStatus = getMeetingTimeStatus(upcomingMeeting, now);
  assert.equal(upStatus.isJoinable, true);
  assert.equal(upStatus.statusLabel, 'Starts in 5m');
});

test('generateDailyBrief creates targeted briefing copy', () => {
  const briefWithOverdue = generateDailyBrief({
    userName: 'Elena',
    meetingsTodayCount: 2,
    tasksPendingCount: 5,
    overdueTasksCount: 2,
    unreadMessagesCount: 7,
  });
  assert.ok(briefWithOverdue.headline.includes('overdue item'));
  assert.ok(briefWithOverdue.summary.includes('2 meetings'));

  const briefNormal = generateDailyBrief({
    userName: 'Alex',
    meetingsTodayCount: 0,
    tasksPendingCount: 3,
    overdueTasksCount: 0,
    unreadMessagesCount: 2,
  });
  assert.ok(briefNormal.headline.includes('Good morning, Alex'));
  assert.ok(briefNormal.focusTip.includes('No meetings today'));
});
