import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  Filter,
  MessageSquare,
  CheckSquare,
  Video,
  Clock,
  Shield,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { useCollabStore } from '../../store/useCollabStore';
import { UserAvatar } from '../UserAvatar';
import { NotificationItem } from '../../types/collab';

export const NotificationsView: React.FC = () => {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotification,
    setActiveNav,
    setActiveChannel,
    users,
  } = useCollabStore();

  const [filterType, setFilterType] = useState<string>('all');

  const filteredNotifications = notifications.filter((n) => {
    if (filterType !== 'all' && n.type !== filterType) return false;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = (item: NotificationItem) => {
    markNotificationRead(item.id);
    if (item.linkNav) {
      setActiveNav(item.linkNav);
      if (item.linkId && item.linkNav === 'chat') {
        setActiveChannel(item.linkId);
      }
    }
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'mention':
      case 'dm':
        return <MessageSquare className="w-4 h-4 text-indigo-400" />;
      case 'task':
        return <CheckSquare className="w-4 h-4 text-amber-400" />;
      case 'meeting':
        return <Video className="w-4 h-4 text-emerald-400" />;
      case 'reminder':
        return <Clock className="w-4 h-4 text-pink-400" />;
      case 'system':
        return <Shield className="w-4 h-4 text-cyan-400" />;
      default:
        return <Bell className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-5">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-400" />
            <span>Activity & Notifications</span>
            {unreadCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
                {unreadCount} unread
              </span>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time mentions, task assignments, meeting invitations, and workspace activity
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllNotificationsRead}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4 text-indigo-400" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* CATEGORY FILTER TABS */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs overflow-x-auto">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
            filterType === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          All Activity ({notifications.length})
        </button>
        <button
          onClick={() => setFilterType('mention')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
            filterType === 'mention' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Mentions & DMs
        </button>
        <button
          onClick={() => setFilterType('task')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
            filterType === 'task' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Tasks
        </button>
        <button
          onClick={() => setFilterType('meeting')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
            filterType === 'meeting' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Meetings
        </button>
        <button
          onClick={() => setFilterType('reminder')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
            filterType === 'reminder' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Reminders
        </button>
        <button
          onClick={() => setFilterType('system')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
            filterType === 'system' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          System
        </button>
      </div>

      {/* NOTIFICATIONS LIST */}
      {filteredNotifications.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
          <Bell className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No notifications in this category</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You're all caught up with your workspace notifications and team activity.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredNotifications.map((notif) => {
            const sender = notif.senderId ? users.find((u) => u.id === notif.senderId) : null;

            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-4 group ${
                  !notif.read
                    ? 'bg-slate-900 border-indigo-500/40 shadow-sm'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                    {sender ? <UserAvatar user={sender} size="xs" showPresence={false} /> : getIcon(notif.type)}
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`text-xs sm:text-sm font-bold truncate ${
                          !notif.read ? 'text-white' : 'text-slate-300'
                        }`}
                      >
                        {notif.title}
                      </h3>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                      )}
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2">{notif.body}</p>

                    <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-1">
                      <span>{notif.createdAt}</span>
                      <span>•</span>
                      <span className="uppercase font-semibold text-slate-400">{notif.type}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-center">
                  <span className="text-xs text-indigo-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <span>Jump</span>
                    <ExternalLink className="w-3 h-3" />
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearNotification(notif.id);
                    }}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                    title="Dismiss"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
