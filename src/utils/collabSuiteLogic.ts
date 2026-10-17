import type {
  Task,
  TaskStatus,
  TaskPriority,
  CalendarEvent,
  Reminder,
  NotificationItem,
  Meeting,
} from '../types/collab.ts';

/**
 * Filter tasks by optional status, assigneeId, priority, and search keyword
 */
export function filterTasks(
  tasks: Task[],
  filters: {
    status?: TaskStatus | 'all';
    assigneeId?: string;
    priority?: TaskPriority | 'all';
    search?: string;
  }
): Task[] {
  return tasks.filter((t) => {
    if (filters.status && filters.status !== 'all' && t.status !== filters.status) {
      return false;
    }
    if (filters.assigneeId && filters.assigneeId !== 'all' && t.assigneeId !== filters.assigneeId) {
      return false;
    }
    if (filters.priority && filters.priority !== 'all' && t.priority !== filters.priority) {
      return false;
    }
    if (filters.search && filters.search.trim() !== '') {
      const q = filters.search.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description.toLowerCase().includes(q);
      const matchTag = t.tags.some((tag) => tag.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchTag) return false;
    }
    return true;
  });
}

/**
 * Calculate task completion metrics
 */
export function calculateTaskMetrics(tasks: Task[]): {
  total: number;
  completed: number;
  inProgress: number;
  todo: number;
  overdue: number;
  completionRate: number;
} {
  const total = tasks.length;
  if (total === 0) {
    return { total: 0, completed: 0, inProgress: 0, todo: 0, overdue: 0, completionRate: 0 };
  }

  const todayStr = new Date().toISOString().split('T')[0];
  let completed = 0;
  let inProgress = 0;
  let todo = 0;
  let overdue = 0;

  for (const t of tasks) {
    if (t.status === 'done') {
      completed++;
    } else {
      if (t.status === 'in_progress' || t.status === 'in_review') inProgress++;
      if (t.status === 'todo') todo++;
      if (t.dueDate < todayStr) overdue++;
    }
  }

  const completionRate = Math.round((completed / total) * 100);
  return { total, completed, inProgress, todo, overdue, completionRate };
}

/**
 * Check if two calendar time intervals overlap
 */
export function areTimeIntervalsOverlapping(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  return startA < endB && startB < endA;
}

/**
 * Detect event conflicts for an attendee
 */
export function detectCalendarConflicts(
  events: CalendarEvent[],
  targetEvent: Partial<CalendarEvent>,
  excludeId?: string
): CalendarEvent[] {
  if (!targetEvent.startDate || !targetEvent.startTime || !targetEvent.endTime) {
    return [];
  }

  const targetStart = `${targetEvent.startDate}T${targetEvent.startTime}:00`;
  const targetEnd = `${targetEvent.endDate || targetEvent.startDate}T${targetEvent.endTime}:00`;
  const targetAttendees = targetEvent.attendees || [];

  return events.filter((ev) => {
    if (excludeId && ev.id === excludeId) return false;
    const evStart = `${ev.startDate}T${ev.startTime}:00`;
    const evEnd = `${ev.endDate}T${ev.endTime}:00`;

    const overlaps = areTimeIntervalsOverlapping(targetStart, targetEnd, evStart, evEnd);
    if (!overlaps) return false;

    // Check if any attendees are shared
    if (targetAttendees.length === 0) return true;
    return ev.attendees.some((att) => targetAttendees.includes(att));
  });
}

/**
 * Categorize reminders into Overdue, Due Today, and Upcoming
 */
export function categorizeReminders(
  reminders: Reminder[],
  nowTimestamp: number = Date.now()
): {
  overdue: Reminder[];
  today: Reminder[];
  upcoming: Reminder[];
  completed: Reminder[];
} {
  const nowDate = new Date(nowTimestamp);
  const todayDateStr = nowDate.toISOString().split('T')[0];

  const overdue: Reminder[] = [];
  const today: Reminder[] = [];
  const upcoming: Reminder[] = [];
  const completed: Reminder[] = [];

  for (const r of reminders) {
    if (r.completed) {
      completed.push(r);
      continue;
    }

    const dueDate = new Date(r.dueAt);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    if (dueDate.getTime() < nowTimestamp && dueDateStr !== todayDateStr) {
      overdue.push(r);
    } else if (dueDateStr === todayDateStr) {
      today.push(r);
    } else {
      upcoming.push(r);
    }
  }

  return { overdue, today, upcoming, completed };
}

/**
 * Unread notifications metric
 */
export function aggregateNotifications(notifications: NotificationItem[]): {
  unreadCount: number;
  byType: Record<string, number>;
} {
  let unreadCount = 0;
  const byType: Record<string, number> = {};

  for (const n of notifications) {
    if (!n.read) {
      unreadCount++;
      byType[n.type] = (byType[n.type] || 0) + 1;
    }
  }

  return { unreadCount, byType };
}

/**
 * Generate a clean, unique meeting ID and join link
 */
export function generateMeetingCode(prefix = 'cf'): { code: string; link: string } {
  const part1 = Math.random().toString(36).substring(2, 5);
  const part2 = Math.random().toString(36).substring(2, 6);
  const part3 = Math.random().toString(36).substring(2, 5);
  const code = `${prefix}-${part1}-${part2}-${part3}`;
  const link = `https://collabflow.app/meet/${code}`;
  return { code, link };
}

/**
 * Calculate meeting status relative to now
 */
export function getMeetingTimeStatus(
  meeting: Meeting,
  nowTimestamp: number = Date.now()
): {
  isJoinable: boolean;
  statusLabel: string;
  minutesUntilStart: number;
} {
  if (meeting.status === 'live') {
    return { isJoinable: true, statusLabel: 'Live Now', minutesUntilStart: 0 };
  }
  if (meeting.status === 'completed') {
    return { isJoinable: false, statusLabel: 'Ended', minutesUntilStart: -1 };
  }
  if (meeting.status === 'cancelled') {
    return { isJoinable: false, statusLabel: 'Cancelled', minutesUntilStart: -1 };
  }

  const meetingTime = new Date(meeting.scheduledAt).getTime();
  const diffMinutes = Math.round((meetingTime - nowTimestamp) / (1000 * 60));

  // Joinable 10 mins before start until duration ends
  const isJoinable = diffMinutes <= 10 && diffMinutes >= -meeting.durationMinutes;

  let statusLabel = '';
  if (diffMinutes <= 0 && diffMinutes >= -meeting.durationMinutes) {
    statusLabel = 'In progress';
  } else if (diffMinutes <= 10 && diffMinutes > 0) {
    statusLabel = `Starts in ${diffMinutes}m`;
  } else if (diffMinutes > 10 && diffMinutes <= 60) {
    statusLabel = `In ${diffMinutes} mins`;
  } else if (diffMinutes > 60 && diffMinutes <= 1440) {
    const hours = Math.round(diffMinutes / 60);
    statusLabel = `In ${hours} hour${hours > 1 ? 's' : ''}`;
  } else {
    statusLabel = new Date(meeting.scheduledAt).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return { isJoinable, statusLabel, minutesUntilStart: diffMinutes };
}

/**
 * Generates an executive daily brief summary
 */
export function generateDailyBrief(params: {
  userName: string;
  meetingsTodayCount: number;
  tasksPendingCount: number;
  overdueTasksCount: number;
  unreadMessagesCount: number;
}): {
  headline: string;
  summary: string;
  focusTip: string;
} {
  const { userName, meetingsTodayCount, tasksPendingCount, overdueTasksCount, unreadMessagesCount } =
    params;

  let headline = `Good morning, ${userName}!`;
  if (overdueTasksCount > 0) {
    headline = `${userName}, you have ${overdueTasksCount} overdue item${overdueTasksCount > 1 ? 's' : ''} requiring attention today.`;
  } else if (meetingsTodayCount > 2) {
    headline = `Busy day ahead, ${userName} — ${meetingsTodayCount} team meetings scheduled.`;
  }

  const summary = `You have ${meetingsTodayCount} meeting${meetingsTodayCount === 1 ? '' : 's'} scheduled today, ${tasksPendingCount} active task${tasksPendingCount === 1 ? '' : 's'}, and ${unreadMessagesCount} unread message${unreadMessagesCount === 1 ? '' : 's'} across your channels.`;

  let focusTip = 'Schedule a 45-minute focus block before your afternoon standup.';
  if (overdueTasksCount > 0) {
    focusTip = 'Triage overdue deliverables first before diving into new team chats.';
  } else if (meetingsTodayCount === 0) {
    focusTip = 'No meetings today — excellent day for deep, uninterrupted engineering work.';
  }

  return { headline, summary, focusTip };
}
