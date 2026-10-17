import React from 'react';
import {
  Home,
  MessageSquare,
  Users2,
  Video,
  Calendar,
  CheckSquare,
  Clock,
  Bell,
  FolderGit2,
  UserCheck,
  Sparkles,
  Settings,
  Plus,
  Gamepad2,
  Database,
  Code2,
} from 'lucide-react';
import { useCollabStore, AppTheme } from '../../store/useCollabStore';
import { NavSection } from '../../types/collab';
import { aggregateNotifications } from '../../utils/collabSuiteLogic';

interface NavItem {
  id: NavSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const GlobalNavRail: React.FC = () => {
  const {
    activeNav,
    setActiveNav,
    workspaces,
    activeWorkspaceId,
    setActiveWorkspace,
    setCreateChannelOpen,
    setArchitectureOpen,
    setPresenceInspectorOpen,
    setGameOpen,
    theme,
    notifications,
  } = useCollabStore();

  const { unreadCount } = aggregateNotifications(notifications);

  const navItems: NavItem[] = [
    { id: 'home', label: 'My Day', icon: Home },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'teams', label: 'Teams', icon: Users2 },
    { id: 'meetings', label: 'Meetings', icon: Video },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'reminders', label: 'Reminders', icon: Clock },
    { id: 'notifications', label: 'Activity', icon: Bell, badge: unreadCount },
    { id: 'files', label: 'Files', icon: FolderGit2 },
    { id: 'people', label: 'People', icon: UserCheck },
    { id: 'ai', label: 'AI Brief', icon: Sparkles },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const railThemeStyles: Record<AppTheme, { rail: string; activeItem: string; inactiveItem: string }> = {
    slack: {
      rail: 'bg-slate-950 border-r border-slate-800/80',
      activeItem: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105',
      inactiveItem: 'text-slate-400 hover:text-slate-200 hover:bg-slate-900',
    },
    teams: {
      rail: 'bg-[#1b1c24] border-r border-[#2d2e38]',
      activeItem: 'bg-[#6264a7] text-white shadow-md shadow-[#6264a7]/30 scale-105',
      inactiveItem: 'text-slate-400 hover:text-slate-200 hover:bg-[#252633]',
    },
    midnight: {
      rail: 'bg-black border-r border-neutral-800',
      activeItem: 'bg-neutral-800 text-white shadow-md scale-105',
      inactiveItem: 'text-neutral-400 hover:text-white hover:bg-neutral-900',
    },
    light: {
      rail: 'bg-slate-100 border-r border-slate-300',
      activeItem: 'bg-indigo-600 text-white shadow-md scale-105',
      inactiveItem: 'text-slate-600 hover:text-slate-900 hover:bg-slate-200',
    },
  };

  const style = railThemeStyles[theme];

  return (
    <div className={`w-16 flex flex-col items-center py-3 justify-between shrink-0 select-none z-20 ${style.rail}`}>
      {/* Top: Workspaces & Core Navigation */}
      <div className="flex flex-col items-center gap-2 w-full px-2">
        {/* Workspace Switcher Logos */}
        <div className="flex flex-col items-center gap-2 pb-2 border-b border-slate-800/80 w-full">
          {workspaces.map((ws) => {
            const isActive = ws.id === activeWorkspaceId;
            return (
              <button
                key={ws.id}
                onClick={() => setActiveWorkspace(ws.id)}
                title={ws.name}
                className={`relative w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs transition-all duration-150 ${
                  isActive
                    ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-950 scale-105 text-white bg-indigo-600 shadow-md'
                    : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {ws.icon}
                {isActive && (
                  <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full" />
                )}
              </button>
            );
          })}

          <button
            title="Create or Join Workspace"
            onClick={() => setCreateChannelOpen(true)}
            className="w-10 h-10 rounded-xl bg-slate-800/40 border border-dashed border-slate-700/80 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 hover:bg-slate-800/80 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Core Navigation Items */}
        <nav className="flex flex-col items-center gap-1.5 w-full pt-1" aria-label="Main Navigation">
          {navItems.map((item) => {
            const isActive = activeNav === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                title={item.label}
                aria-label={item.label}
                className={`relative w-10 h-10 rounded-xl flex flex-col items-center justify-center transition-all duration-150 ${
                  isActive ? style.activeItem : style.inactiveItem
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[9px] font-medium tracking-tight mt-0.5 leading-none">
                  {item.label.split(' ')[0]}
                </span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-400 rounded-r-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Inspectors & Tools */}
      <div className="flex flex-col items-center gap-2 pt-2 border-t border-slate-800/80 w-full px-2">
        {/* Architecture Inspector */}
        <button
          onClick={() => setArchitectureOpen(true)}
          title="Full Stack Architecture & Django Codebase"
          className="relative w-9 h-9 rounded-xl bg-indigo-950/80 border border-indigo-500/40 hover:bg-indigo-900 text-indigo-300 flex items-center justify-center transition-colors group"
        >
          <Code2 className="w-4 h-4" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-slate-950" />
        </button>

        {/* Redis Presence Inspector */}
        <button
          onClick={() => setPresenceInspectorOpen(true)}
          title="Redis Presence & Sockets Inspector"
          className="w-9 h-9 rounded-xl bg-emerald-950/60 border border-emerald-500/40 hover:bg-emerald-900 text-emerald-300 flex items-center justify-center transition-colors"
        >
          <Database className="w-4 h-4" />
        </button>

        {/* Break Arcade Game */}
        <button
          onClick={() => setGameOpen(true)}
          title="Play Break Time Arcade"
          className="w-9 h-9 rounded-xl bg-amber-950/60 border border-amber-500/40 hover:bg-amber-900 text-amber-300 flex items-center justify-center transition-colors"
        >
          <Gamepad2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
