import React, { useState } from 'react';
import {
  Search,
  Plus,
  Bell,
  Sparkles,
  Video,
  CheckSquare,
  Calendar as CalendarIcon,
  Clock,
  Menu,
  ChevronDown,
  Palette,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useCollabStore, AppTheme } from '../../store/useCollabStore';
import { UserAvatar } from '../UserAvatar';
import { aggregateNotifications } from '../../utils/collabSuiteLogic';

export const TopNavBar: React.FC = () => {
  const {
    currentUser,
    workspaces,
    activeWorkspaceId,
    activeNav,
    setActiveNav,
    setSearchOpen,
    setQuickCreateOpen,
    startInstantMeeting,
    notifications,
    markAllNotificationsRead,
    markNotificationRead,
    theme,
    setTheme,
    soundEnabled,
    setSoundEnabled,
    isMobileSidebarOpen,
    setMobileSidebarOpen,
    setProfileOpen,
  } = useCollabStore();

  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
  const { unreadCount } = aggregateNotifications(notifications);

  const navTitles: Record<string, string> = {
    home: 'My Day & Dashboard',
    chat: 'Direct Messages & Conversations',
    teams: 'Teams & Channels',
    meetings: 'Meetings & Calls',
    calendar: 'Integrated Calendar',
    tasks: 'Tasks & Projects',
    reminders: 'Reminders & Follow-ups',
    notifications: 'Notifications & Activity',
    files: 'Files & Document Hub',
    people: 'People & Directory',
    ai: 'AI Assistant & Daily Brief',
    settings: 'Workspace Settings',
  };

  return (
    <header className="h-14 w-full border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between shrink-0 z-30 select-none">
      {/* LEFT: Mobile Menu, Workspace & Breadcrumbs */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={() => setMobileSidebarOpen(!isMobileSidebarOpen)}
          className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 truncate">
          <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            {activeWorkspace.name}
          </span>
          <span className="text-slate-600 hidden sm:inline">/</span>
          <span className="text-xs font-medium text-indigo-400 hidden sm:inline truncate">
            {navTitles[activeNav] || activeNav}
          </span>
        </div>
      </div>

      {/* CENTER: Global Search Bar */}
      <div className="flex-1 max-w-md mx-3 hidden md:block">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs transition-all shadow-inner group"
        >
          <Search className="w-3.5 h-3.5 group-hover:text-indigo-400 transition-colors" />
          <span className="flex-1 text-left">Search messages, tasks, files, meetings...</span>
          <kbd className="text-[10px] bg-slate-900 border border-slate-700/80 px-1.5 py-0.5 rounded text-slate-400 font-mono">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* RIGHT: Quick Actions, Notifications, Theme, Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Quick Create Button & Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsQuickMenuOpen(!isQuickMenuOpen)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02]"
            title="Create new task, event, reminder, or meeting"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New</span>
            <ChevronDown className="w-3 h-3 text-indigo-200" />
          </button>

          {isQuickMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsQuickMenuOpen(false)}
              />
              <div className="absolute right-0 mt-1.5 w-52 rounded-xl bg-slate-900 border border-slate-800 shadow-xl py-1 z-50 text-xs">
                <button
                  onClick={() => {
                    setIsQuickMenuOpen(false);
                    startInstantMeeting('Instant Team Sync');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <Video className="w-4 h-4 text-emerald-400" />
                  <span>Start Instant Meeting</span>
                </button>
                <button
                  onClick={() => {
                    setIsQuickMenuOpen(false);
                    setQuickCreateOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <CheckSquare className="w-4 h-4 text-indigo-400" />
                  <span>Create Task</span>
                </button>
                <button
                  onClick={() => {
                    setIsQuickMenuOpen(false);
                    setActiveNav('calendar');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <CalendarIcon className="w-4 h-4 text-pink-400" />
                  <span>Schedule Event</span>
                </button>
                <button
                  onClick={() => {
                    setIsQuickMenuOpen(false);
                    setActiveNav('reminders');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Add Reminder</span>
                </button>
                <div className="h-px bg-slate-800 my-1" />
                <button
                  onClick={() => {
                    setIsQuickMenuOpen(false);
                    setActiveNav('ai');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-indigo-400 hover:bg-indigo-950/40 transition-colors font-medium"
                >
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Ask AI Assistant</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Notifications Bell & Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
            className="relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsNotifDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-1.5 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-50 overflow-hidden text-xs">
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-100">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                  {notifications.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markNotificationRead(n.id);
                        setActiveNav(n.linkNav);
                        setIsNotifDropdownOpen(false);
                      }}
                      className={`p-3 cursor-pointer hover:bg-slate-800/50 transition-colors ${
                        !n.read ? 'bg-indigo-950/20' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-200">{n.title}</span>
                        <span className="text-[10px] text-slate-500">{n.createdAt}</span>
                      </div>
                      <p className="text-slate-400 line-clamp-2">{n.body}</p>
                    </div>
                  ))}
                </div>

                <div className="p-2 border-t border-slate-800 bg-slate-950/50 text-center">
                  <button
                    onClick={() => {
                      setIsNotifDropdownOpen(false);
                      setActiveNav('notifications');
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    View All Activity & Notifications →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Audio chime toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          title={soundEnabled ? 'Chime sound enabled' : 'Chime sound muted'}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors hidden sm:flex"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => {
            const themes: AppTheme[] = ['slack', 'teams', 'midnight', 'light'];
            const nextIdx = (themes.indexOf(theme) + 1) % themes.length;
            setTheme(themes[nextIdx]);
          }}
          title={`Theme: ${theme.toUpperCase()} (Click to toggle)`}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Palette className="w-4 h-4" />
        </button>

        {/* User Profile Avatar */}
        <button
          onClick={() => setProfileOpen(true)}
          className="flex items-center gap-1.5 pl-1.5 pr-1 py-1 rounded-xl hover:bg-slate-800/60 transition-colors group"
          title={`Logged in as ${currentUser.name}`}
        >
          <UserAvatar user={currentUser} size="xs" />
          <span className="text-xs font-medium text-slate-300 group-hover:text-white hidden lg:inline max-w-[100px] truncate">
            {currentUser.name.split(' ')[0]}
          </span>
        </button>
      </div>
    </header>
  );
};
