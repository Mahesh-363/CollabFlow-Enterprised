import React, { useRef, useEffect } from 'react';
import {
  Hash,
  Lock,
  Headphones,
  Search,
  Code2,
  Users,
  Pin,
  Sparkles,
  ChevronDown,
  Menu,
  Database,
  Shield,
  LogOut,
  Gamepad2,
} from 'lucide-react';
import { useCollabStore } from '../store/useCollabStore';
import { MessageItem } from './MessageItem';
import { MessageInput } from './MessageInput';
import { UserAvatar } from './UserAvatar';
import { formatDateDivider } from '../utils/collabLogic';

export const ChatArea: React.FC = () => {
  const {
    channels,
    activeChannelId,
    directMessages,
    messages,
    users,
    currentUser,
    typingUsers,
    startHuddle,
    activeHuddle,
    setSearchOpen,
    setArchitectureOpen,
    setProfileOpen,
    setPresenceInspectorOpen,
    setAuthInspectorOpen,
    logout,
    enterpriseTrial,
    setGameOpen,
  } = useCollabStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Determine if active conversation is a channel or a DM
  const channel = channels.find((c) => c.id === activeChannelId);
  const dm = directMessages.find((d) => d.id === activeChannelId);

  const dmOtherUserId = dm
    ? (dm.participantIds.includes(currentUser.id)
        ? dm.participantIds.find((id) => id !== currentUser.id)
        : (dm.participantIds[1] || dm.participantIds[0]))
    : null;
  const dmOtherUser = dmOtherUserId ? users.find((u) => u.id === dmOtherUserId) : null;

  // Filter messages for active channel or DM
  const currentMessages = messages.filter((m) => m.channelId === activeChannelId);
  const typingList = typingUsers[activeChannelId] || [];

  // Find pinned message if any
  const pinnedMessage = currentMessages.find((m) => m.pinned);

  // Auto scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages.length]);

  return (
    <main className="flex-1 flex flex-col h-full bg-slate-950 min-w-0 overflow-hidden">
      {/* CHANNEL / DM TOP BAR */}
      <header className="h-14 px-4 sm:px-6 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between shrink-0 z-10 backdrop-blur-sm gap-3">
        <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
          {/* Mobile Menu Button */}
          <button
            onClick={() => useCollabStore.getState().setMobileSidebarOpen(!useCollabStore.getState().isMobileSidebarOpen)}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0"
            title="Toggle channels sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          {channel ? (
            <>
              <div className="flex items-center gap-1.5 font-bold text-base text-slate-100 whitespace-nowrap shrink-0">
                {channel.isPrivate ? (
                  <Lock className="w-4 h-4 text-slate-400" />
                ) : (
                  <Hash className="w-4 h-4 text-slate-400" />
                )}
                <span>{channel.name}</span>
              </div>
              {channel.topic && (
                <>
                  <span className="text-slate-600 hidden md:inline shrink-0">|</span>
                  <span className="text-xs text-slate-400 truncate hidden md:inline">
                    {channel.topic}
                  </span>
                </>
              )}
            </>
          ) : dmOtherUser ? (
            <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
              <UserAvatar user={dmOtherUser} size="xs" />
              <span className="font-bold text-base text-slate-100">
                {dmOtherUser.name}
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">
                {dmOtherUser.title}
              </span>
            </div>
          ) : (
            <span className="font-bold text-base text-slate-100 whitespace-nowrap shrink-0">Conversation</span>
          )}
        </div>

        {/* TOP BAR ACTIONS */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Huddle Button */}
          <button
            onClick={() => startHuddle(activeChannelId)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeHuddle && activeHuddle.channelId === activeChannelId
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/50'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60'
            }`}
            title="Start or join audio huddle"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Huddle</span>
          </button>

          {/* Quick Search */}
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
            title="Search channel (Cmd+K)"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Redis Presence Engine Inspector */}
          <button
            onClick={() => setPresenceInspectorOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/50 transition-all shadow-sm"
            title="Inspect Redis Presence, Inactivity Timers & WebSocket Sockets"
          >
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                currentUser.presence === 'online' ? 'bg-emerald-400' : currentUser.presence === 'away' ? 'bg-amber-400' : 'bg-slate-400'
              }`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                currentUser.presence === 'online' ? 'bg-emerald-500' : currentUser.presence === 'away' ? 'bg-amber-500' : 'bg-slate-500'
              }`} />
            </span>
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline font-mono">Redis Presence</span>
          </button>

          {/* Architecture & Backend Source Explorer */}
          <button
            onClick={() => setArchitectureOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600/30 transition-all shadow-sm"
            title="View Django, Channels, Celery & Next.js production codebase"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Architecture</span>
          </button>

          {/* Auth & JWT Tokens Inspector */}
          <button
            onClick={() => setAuthInspectorOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-900/50 transition-all shadow-sm"
            title="Inspect OAuth 2.0 / JWT session, access/refresh tokens, and claims"
          >
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline font-mono">Auth & JWT</span>
          </button>

          {/* Break Game Button (For Free Time) */}
          <button
            onClick={() => setGameOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/60 transition-all shadow-sm"
            title="Take a break: Play WALL-E Solar Dash or Bug Blaster!"
          >
            <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Break Arcade</span>
          </button>

          {/* 14-Day Enterprise Trial Badge */}
          {enterpriseTrial.isActive && (
            <div className="hidden xl:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-indigo-700/60 text-[11px] text-indigo-300 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>Trial: {enterpriseTrial.daysRemaining}d left</span>
            </div>
          )}

          {/* Current User Role Pill */}
          <button
            onClick={() => setProfileOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-xs text-slate-300 transition-colors"
            title="Change test persona / role"
          >
            <span className="font-mono text-[10px] uppercase font-bold text-indigo-400">
              {currentUser.role}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {/* Sign Out to Auth Portal Button */}
          <button
            onClick={() => logout()}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-300 hover:text-white transition-colors"
            title="Sign out and return to CollabFlow Authentication Portal"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* PINNED MESSAGE BANNER */}
      {pinnedMessage && (
        <div className="px-6 py-2 bg-indigo-950/30 border-b border-indigo-900/40 flex items-center justify-between text-xs text-indigo-300">
          <div className="flex items-center gap-2 truncate">
            <Pin className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
            <span className="font-semibold text-indigo-200">Pinned:</span>
            <span className="truncate text-slate-300">{pinnedMessage.content}</span>
          </div>
          <span className="text-[10px] text-indigo-400 font-mono shrink-0 ml-2">
            Announcement
          </span>
        </div>
      )}

      {/* MESSAGES SCROLL CONTAINER */}
      <div className="flex-1 overflow-y-auto py-4 space-y-1">
        {/* Channel Welcome Header */}
        {channel && (
          <div className="px-6 pt-4 pb-6 space-y-2 border-b border-slate-900 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-2">
              <Hash className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">
              Welcome to #{channel.name}!
            </h2>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              {channel.description || 'This is the start of the conversation.'}
            </p>
          </div>
        )}

        {/* Message Items grouped by Date */}
        {currentMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-xs">
            <p>No messages yet in this channel.</p>
            <p className="mt-1 text-slate-600">Send the first message below!</p>
          </div>
        ) : (
          currentMessages.map((msg, idx) => {
            const author = users.find((u) => u.id === msg.userId) || users[0];
            const prevMsg = currentMessages[idx - 1];

            // Render date divider if first message or date changed
            const showDateDivider =
              !prevMsg ||
              formatDateDivider(prevMsg.createdAt) !== formatDateDivider(msg.createdAt);

            return (
              <React.Fragment key={msg.id}>
                {showDateDivider && (
                  <div className="relative my-4 flex items-center justify-center px-6">
                    <div className="absolute inset-x-6 h-[1px] bg-slate-800/80" />
                    <span className="relative z-10 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-slate-900 text-slate-400 border border-slate-800 font-mono">
                      {formatDateDivider(msg.createdAt)}
                    </span>
                  </div>
                )}
                <MessageItem message={msg} author={author} />
              </React.Fragment>
            );
          })
        )}

        {/* TYPING INDICATOR */}
        {typingList.length > 0 && (
          <div className="px-6 py-1 flex items-center gap-2 text-xs text-slate-400 italic">
            <div className="flex gap-1 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
            </div>
            <span>
              {typingList.join(', ')} {typingList.length === 1 ? 'is' : 'are'} typing...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* MESSAGE INPUT */}
      <MessageInput
        channelId={activeChannelId}
        placeholder={`Message ${channel ? `#${channel.name}` : dmOtherUser?.name || 'conversation'}`}
      />
    </main>
  );
};
