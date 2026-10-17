export type UserRole = 'owner' | 'admin' | 'member' | 'guest';

export type UserPresence = 'online' | 'away' | 'offline' | 'dnd';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  title: string;
  role: UserRole;
  presence: UserPresence;
  customStatus?: string;
  isBot?: boolean;
}

export interface Reaction {
  emoji: string;
  count: number;
  users: string[]; // user IDs
}

export interface FileAttachment {
  id: string;
  name: string;
  size: string;
  type: 'image' | 'code' | 'pdf' | 'archive';
  url: string;
  previewUrl?: string;
}

export interface Message {
  id: string;
  channelId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  isEdited?: boolean;
  isDeleted?: boolean;
  reactions: Reaction[];
  replyCount: number;
  lastReplyAt?: string;
  threadParticipantIds?: string[];
  attachments?: FileAttachment[];
  pinned?: boolean;
}

export interface ThreadReply {
  id: string;
  messageId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  isEdited?: boolean;
  reactions: Reaction[];
}

export interface Channel {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  topic?: string;
  isPrivate: boolean;
  memberIds: string[];
  unreadCount: number;
  createdById: string;
  createdAt: string;
}

export interface DirectMessageConversation {
  id: string;
  workspaceId: string;
  participantIds: string[];
  unreadCount: number;
  lastMessage?: string;
  lastMessageTime?: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  ownerId: string;
  memberCount: number;
  channels: Channel[];
}

export interface ActiveHuddle {
  channelId: string;
  channelName: string;
  participants: User[];
  isMuted: boolean;
  isScreenSharing: boolean;
  durationSeconds: number;
}

export type NavSection =
  | 'home'
  | 'chat'
  | 'teams'
  | 'meetings'
  | 'calendar'
  | 'tasks'
  | 'reminders'
  | 'notifications'
  | 'files'
  | 'people'
  | 'ai'
  | 'settings';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startDate: string; // ISO date 'YYYY-MM-DD' or ISO timestamp
  startTime: string; // 'HH:MM'
  endDate: string;
  endTime: string;
  allDay?: boolean;
  recurrence?: 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
  location?: string;
  meetingId?: string;
  attendees: string[]; // User IDs
  reminderMinutes: number; // 0, 5, 15, 30, 60
  category: 'meeting' | 'deadline' | 'review' | 'focus' | 'personal';
  color?: string;
}

export interface MeetingChatMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
}

export interface Meeting {
  id: string;
  title: string;
  description: string;
  scheduledAt: string; // ISO timestamp
  durationMinutes: number;
  hostId: string;
  participantIds: string[];
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  meetingLink: string;
  agenda?: string;
  isInstant?: boolean;
  notes?: string;
  actionItems?: string[];
  chatMessages?: MeetingChatMessage[];
}

export interface TaskSubtask {
  id: string;
  title: string;
  completed: boolean;
}

export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
  creatorId: string;
  dueDate: string; // 'YYYY-MM-DD'
  tags: string[];
  subtasks: TaskSubtask[];
  attachments?: FileAttachment[];
  commentsCount: number;
  channelId?: string;
  createdAt: string;
}

export interface Reminder {
  id: string;
  title: string;
  dueAt: string; // ISO string
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  snoozeUntil?: string;
  linkedType?: 'task' | 'message' | 'meeting' | 'event';
  linkedId?: string;
  linkedTitle?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  type: 'mention' | 'dm' | 'task' | 'meeting' | 'reminder' | 'system';
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  linkNav: NavSection;
  linkId?: string;
  senderId?: string;
}

export interface WorkspaceFile {
  id: string;
  name: string;
  size: string;
  sizeBytes: number;
  type: 'document' | 'image' | 'code' | 'media' | 'archive';
  url: string;
  uploadedBy: string; // User ID
  uploadedAt: string;
  channelId?: string;
  taskId?: string;
}
