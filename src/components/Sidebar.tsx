import React, { useState, useEffect } from 'react';
import {
  Home,
  MessageSquare,
  Users2,
  Calendar,
  Video,
  CheckSquare,
  Clock,
  Bell,
  FolderGit2,
  UserCheck,
  Sparkles,
  Settings,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  Code2,
  Database,
  Gamepad2,
  Hash,
  Lock,
  Headphones,
  Search,
  Check,
  Radio,
  Send,
} from 'lucide-react';
import { useCollabStore } from '../store/useCollabStore';
import { UserAvatar } from './UserAvatar';
import { NavSection } from '../types/collab';
import { aggregateNotifications } from '../utils/collabSuiteLogic';

interface NavItemConfig {
  id: NavSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const Sidebar: React.FC = () => {
  const {
    activeNav,
    setActiveNav,
    workspaces,
    activeWorkspaceId,
    setActiveWorkspace,
    channels,
    activeChannelId,
    setActiveChannel,
    directMessages,
    users,
    currentUser,
    notifications,
    setSearchOpen,
    setCreateChannelOpen,
    setProfileOpen,
    setArchitectureOpen,
    setPresenceInspectorOpen,
    setGameOpen,
    setHelpModalOpen,
    isSidebarCollapsed,
    toggleSidebarCollapsed,
    isMobileSidebarOpen,
    setMobileSidebarOpen,
    activeHuddle,
    startHuddle,
    endHuddle,
    simulateColleagueMessage,
  } = useCollabStore();

  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);
  const [isDevMenuOpen, setIsDevMenuOpen] = useState(false);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
  const workspaceChannels = channels.filter((c) => c.workspaceId === activeWorkspaceId);
  const { unreadCount } = aggregateNotifications(notifications);

  // Secondary sidebar for Channels & DMs is visible in Chat or Teams, or when mobile drawer is open
  const showChannelsSidebar = activeNav === 'chat' || activeNav === 'teams' || isMobileSidebarOpen;

  // Keyboard shortcut: Cmd/Ctrl + \ to collapse/expand sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        toggleSidebarCollapsed();
      }
      if (e.key === 'Escape') {
        if (isWorkspaceDropdownOpen) setIsWorkspaceDropdownOpen(false);
        if (isDevMenuOpen) setIsDevMenuOpen(false);
        if (isMobileSidebarOpen) setMobileSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebarCollapsed, isWorkspaceDropdownOpen, isDevMenuOpen, isMobileSidebarOpen, setMobileSidebarOpen]);

  // Is current user authorized for developer / system tools?
  const isAuthorizedForDevTools =
    currentUser.role === 'owner' ||
    currentUser.role === 'admin' ||
    process.env.NODE_ENV !== 'production';

  // 1. WORKSPACE Group
  const workspaceNavItems: NavItemConfig[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'teams', label: 'Teams & Channels', icon: Users2 },
  ];

  // 2. PLAN & ORGANIZE Group
  const planNavItems: NavItemConfig[] = [
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'meetings', label: 'Meetings', icon: Video },
    { id: 'tasks', label: 'Tasks & Projects', icon: CheckSquare },
    { id: 'reminders', label: 'Reminders', icon: Clock },
  ];

  // 3. COLLABORATE Group
  const collaborateNavItems: NavItemConfig[] = [
    {
      id: 'notifications',
      label: 'Activity',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { id: 'files', label: 'Files', icon: FolderGit2 },
    { id: 'people', label: 'People', icon: UserCheck },
    { id: 'ai', label: 'AI Assistant', icon: Sparkles },
  ];

  const handleNavClick = (sectionId: NavSection) => {
    setActiveNav(sectionId);
    if (isMobileSidebarOpen && sectionId !== 'chat' && sectionId !== 'teams') {
      setMobileSidebarOpen(false);
    }
  };

  const renderNavButton = (item: NavItemConfig) => {
    const isActive = activeNav === item.id;
    const Icon = item.icon;

    if (isSidebarCollapsed) {
      return (
        <button
          key={item.id}
          type="button"
          onClick={() => handleNavClick(item.id)}
          title={`${item.label}${item.badge ? ` (${item.badge} unread)` : ''}`}
          aria-label={item.label}
          className={`relative w-11 h-11 mx-auto rounded-xl flex items-center justify-center transition-all duration-150 group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-purple-500/50 active:scale-95 ${
            isActive
              ? 'bg-purple-600/20 text-purple-300 font-bold border-l-2 border-purple-500 shadow-sm shadow-purple-900/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
          }`}
        >
          <Icon
            className={`w-4.5 h-4.5 transition-transform duration-150 ${
              isActive ? 'text-purple-400 scale-105' : 'group-hover:text-purple-300'
            }`}
          />
          {item.badge !== undefined && item.badge > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-purple-600 text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          )}
        </button>
      );
    }

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => handleNavClick(item.id)}
        aria-label={item.label}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all duration-150 text-left group relative focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-purple-500/50 active:scale-[0.99] ${
          isActive
            ? 'bg-purple-600/15 text-purple-200 font-semibold shadow-xs'
            : 'text-slate-300 hover:text-white hover:bg-slate-900/70'
        }`}
      >
        {/* Subtle slim active purple indicator */}
        {isActive && (
          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-purple-500 rounded-r shadow-xs" />
        )}
        <Icon
          className={`w-4 h-4 shrink-0 transition-colors ${
            isActive ? 'text-purple-400' : 'text-slate-400 group-hover:text-purple-300'
          }`}
        />
        <span className="truncate flex-1 font-medium">{item.label}</span>
        {item.badge !== undefined && item.badge > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-bold font-mono shadow-xs shrink-0">
            {item.badge > 99 ? '99+' : item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-xs transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 md:static flex h-full shrink-0 select-none transition-transform duration-200 ease-in-out ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        aria-label="Sidebar Navigation"
      >
        {/* PRIMARY SIDEBAR (Expandable ~248px or Collapsed ~72px) */}
        <div
          className={`h-full flex flex-col justify-between bg-[#0a0d14] border-r border-slate-800/80 transition-all duration-200 ease-in-out ${
            isSidebarCollapsed ? 'w-[72px]' : 'w-[248px]'
          }`}
        >
          {/* TOP SECTION: WORKSPACE SWITCHER & COLLAPSE TOGGLE */}
          <div className="p-2.5 border-b border-slate-800/80 shrink-0 relative bg-slate-950/30">
            {/* Expanded Header: Active Workspace Dropdown + Collapse Button */}
            {!isSidebarCollapsed ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-1">
                  <div className="relative flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
                      title={`Active Workspace: ${activeWorkspace.name} (Click to switch)`}
                      className="w-full flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-900 transition-colors text-left group"
                    >
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-md ring-1 ring-purple-500/40 bg-gradient-to-tr from-purple-700 via-indigo-600 to-violet-500">
                        {activeWorkspace.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-white truncate block">
                            {activeWorkspace.name}
                          </span>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-300 shrink-0 ml-1 transition-transform" />
                        </div>
                        <span className="text-[10px] text-purple-400 font-mono block">
                          Enterprise Plan
                        </span>
                      </div>
                    </button>
                  </div>

                  {/* Collapse Sidebar Button */}
                  <button
                    type="button"
                    onClick={toggleSidebarCollapsed}
                    title="Collapse sidebar (⌘\)"
                    aria-label="Collapse sidebar"
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors shrink-0"
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </button>
                </div>

                {/* Workspace Quick Avatar Shortcuts Bar */}
                <div className="flex items-center gap-1.5 px-1 pt-1">
                  {workspaces.map((ws) => {
                    const isSelected = ws.id === activeWorkspaceId;
                    return (
                      <button
                        key={ws.id}
                        type="button"
                        onClick={() => setActiveWorkspace(ws.id)}
                        title={`${ws.name} (${ws.memberCount} members)`}
                        className={`relative w-7 h-7 rounded-lg text-[10px] font-bold flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow-xs ring-2 ring-purple-400 scale-105'
                            : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {ws.icon}
                        {isSelected && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 border border-black" />
                        )}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setCreateChannelOpen(true)}
                    title="Create workspace or channel"
                    className="w-7 h-7 rounded-lg bg-slate-950 border border-dashed border-slate-700 hover:border-purple-500 text-slate-400 hover:text-purple-300 flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              /* Collapsed Header: Vertical Stack of Workspace Avatars + Expand Button */
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
                    title={`Active Workspace: ${activeWorkspace.name} (Click to switch)`}
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-md ring-2 ring-purple-500 bg-gradient-to-tr from-purple-700 via-indigo-600 to-violet-500 transition-transform active:scale-95"
                  >
                    {activeWorkspace.icon}
                  </button>
                </div>

                {/* Other workspaces shortcuts (collapsed) */}
                <div className="flex flex-col items-center gap-1.5 pt-1">
                  {workspaces
                    .filter((ws) => ws.id !== activeWorkspaceId)
                    .slice(0, 2)
                    .map((ws) => (
                      <button
                        key={ws.id}
                        type="button"
                        onClick={() => setActiveWorkspace(ws.id)}
                        title={`${ws.name} (${ws.memberCount} members)`}
                        className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-[11px] flex items-center justify-center transition-colors"
                      >
                        {ws.icon}
                      </button>
                    ))}
                </div>

                {/* Expand sidebar button */}
                <button
                  type="button"
                  onClick={toggleSidebarCollapsed}
                  title="Expand sidebar (⌘\)"
                  aria-label="Expand sidebar"
                  className="mt-1 p-1.5 text-slate-400 hover:text-purple-300 rounded-lg hover:bg-slate-900 transition-colors"
                >
                  <PanelLeftOpen className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Workspace Dropdown Menu */}
            {isWorkspaceDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-50"
                  onClick={() => setIsWorkspaceDropdownOpen(false)}
                />
                <div
                  className={`absolute ${
                    isSidebarCollapsed ? 'left-16 top-2' : 'left-2 top-14'
                  } w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 space-y-1 text-xs`}
                >
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Switch Workspace
                  </div>
                  {workspaces.map((ws) => {
                    const isCurrent = ws.id === activeWorkspaceId;
                    return (
                      <button
                        key={ws.id}
                        type="button"
                        onClick={() => {
                          setActiveWorkspace(ws.id);
                          setIsWorkspaceDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl transition-colors ${
                          isCurrent
                            ? 'bg-purple-600/20 text-purple-200 font-semibold'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-7 h-7 rounded-lg bg-slate-800 text-purple-300 font-bold text-xs flex items-center justify-center shrink-0">
                            {ws.icon}
                          </span>
                          <div className="text-left truncate">
                            <p className="truncate font-medium">{ws.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              {ws.memberCount} members
                            </p>
                          </div>
                        </div>
                        {isCurrent && <Check className="w-4 h-4 text-purple-400 shrink-0" />}
                      </button>
                    );
                  })}

                  <div className="pt-1.5 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => {
                        setIsWorkspaceDropdownOpen(false);
                        setCreateChannelOpen(true);
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-xl text-purple-400 hover:bg-purple-950/40 hover:text-purple-300 font-medium transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create New Workspace</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* MIDDLE: SCROLLABLE NAVIGATION LIST */}
          <div className="flex-1 overflow-y-auto px-2 py-3 space-y-5 custom-sidebar-scroll">
            {/* GROUP 1: WORKSPACE */}
            <div className="space-y-1">
              {!isSidebarCollapsed && (
                <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Workspace
                </div>
              )}
              {workspaceNavItems.map(renderNavButton)}
            </div>

            {/* GROUP 2: PLAN & ORGANIZE */}
            <div className="space-y-1">
              {!isSidebarCollapsed && (
                <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Plan & Organize
                </div>
              )}
              {planNavItems.map(renderNavButton)}
            </div>

            {/* GROUP 3: COLLABORATE */}
            <div className="space-y-1">
              {!isSidebarCollapsed && (
                <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Collaborate
                </div>
              )}
              {collaborateNavItems.map(renderNavButton)}
            </div>
          </div>

          {/* BOTTOM SECTION: DEV TOOLS, HELP, SETTINGS & PROFILE */}
          <div className="p-2 border-t border-slate-800/80 bg-slate-950/40 space-y-1 shrink-0 relative">
            {/* Developer Tools Menu (Shown to Owner, Admin, or in Dev Mode) */}
            {isAuthorizedForDevTools && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDevMenuOpen(!isDevMenuOpen)}
                  title="Developer Tools & System Inspectors"
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-colors group ${
                    isSidebarCollapsed ? 'justify-center px-0' : ''
                  } ${
                    isDevMenuOpen
                      ? 'bg-purple-950/40 text-purple-300'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Code2 className="w-4 h-4 text-purple-400 shrink-0" />
                  {!isSidebarCollapsed && (
                    <div className="flex-1 text-left flex items-center justify-between">
                      <span className="font-medium">Developer Tools</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                  )}
                </button>

                {/* Dev Tools Popover Menu */}
                {isDevMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsDevMenuOpen(false)}
                    />
                    <div
                      className={`absolute bottom-12 ${
                        isSidebarCollapsed ? 'left-16' : 'left-2'
                      } w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 space-y-1 text-xs`}
                    >
                      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-400 font-mono flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5" />
                        <span>Developer & System Tools</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsDevMenuOpen(false);
                          setPresenceInspectorOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 p-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left"
                      >
                        <Database className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <p className="font-semibold text-white">Redis Presence Map</p>
                          <p className="text-[10px] text-slate-500">Redis 7.2 socket heartbeat</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsDevMenuOpen(false);
                          setArchitectureOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 p-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left"
                      >
                        <Radio className="w-4 h-4 text-indigo-400 shrink-0" />
                        <div>
                          <p className="font-semibold text-white">Full Stack Architecture</p>
                          <p className="text-[10px] text-slate-500">Django, Celery & Channels</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsDevMenuOpen(false);
                          setGameOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 p-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left"
                      >
                        <Gamepad2 className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                          <p className="font-semibold text-white">Break Time Arcade</p>
                          <p className="text-[10px] text-slate-500">WALL-E Solar Dash</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          simulateColleagueMessage('benchmarks');
                          setIsDevMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 p-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left"
                      >
                        <Send className="w-4 h-4 text-cyan-400 shrink-0" />
                        <div>
                          <p className="font-semibold text-white">Simulate Inbound Event</p>
                          <p className="text-[10px] text-slate-500">Trigger test message chime</p>
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Help & Support Trigger */}
            <button
              type="button"
              onClick={() => setHelpModalOpen(true)}
              title="Help & Support (Shortcuts, docs & priority assist)"
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 transition-colors ${
                isSidebarCollapsed ? 'justify-center px-0' : ''
              }`}
            >
              <HelpCircle className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-purple-300" />
              {!isSidebarCollapsed && <span className="font-medium text-left">Help & Support</span>}
            </button>

            {/* Workspace Settings */}
            <button
              type="button"
              onClick={() => handleNavClick('settings')}
              title="Workspace Settings"
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-colors ${
                isSidebarCollapsed ? 'justify-center px-0' : ''
              } ${
                activeNav === 'settings'
                  ? 'bg-purple-600/15 text-purple-200 font-semibold border-l-2 border-purple-500'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Settings className={`w-4 h-4 shrink-0 ${activeNav === 'settings' ? 'text-purple-400' : ''}`} />
              {!isSidebarCollapsed && <span className="font-medium text-left">Settings</span>}
            </button>

            {/* User Profile & Account Menu */}
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              title={`Logged in as ${currentUser.name} (${currentUser.role})`}
              className={`w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-900 transition-colors text-left group ${
                isSidebarCollapsed ? 'justify-center p-1' : ''
              }`}
            >
              <UserAvatar user={currentUser} size="sm" />
              {!isSidebarCollapsed && (
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-xs text-slate-200 group-hover:text-white truncate block">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate block capitalize font-mono">
                    {currentUser.role} • {currentUser.presence}
                  </span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* SECONDARY SIDEBAR: CHANNELS & DMS (Visible in Chat / Teams views) */}
        {showChannelsSidebar && (
          <div className="w-64 flex flex-col justify-between bg-slate-900/95 border-r border-slate-800/80 text-slate-200 transition-all duration-200">
            <div className="flex flex-col h-full overflow-hidden">
              {/* Secondary Header */}
              <div className="h-14 px-4 border-b border-slate-800/70 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="font-bold text-sm tracking-tight truncate text-slate-100">
                    {activeWorkspace.name}
                  </span>
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                    {activeWorkspace.memberCount}
                  </span>
                </div>
                <button
                  onClick={() => setProfileOpen(true)}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800/60 transition-colors"
                  title="Workspace Settings"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* Channels & DM scrollable container */}
              <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
                {/* Quick Actions / Jump list */}
                <div className="space-y-0.5">
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Jump to conversation</span>
                    <kbd className="ml-auto text-[10px] bg-slate-800/80 border border-slate-700/60 px-1 py-0.5 rounded text-slate-400 font-mono">
                      ⌘K
                    </kbd>
                  </button>
                </div>

                {/* CHANNELS SECTION */}
                <div>
                  <div className="flex items-center justify-between px-2.5 mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                      Channels
                    </span>
                    <button
                      onClick={() => setCreateChannelOpen(true)}
                      className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800/60 transition-colors"
                      title="Create new channel"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-0.5">
                    {workspaceChannels.map((channel) => {
                      const isActive =
                        channel.id === activeChannelId &&
                        (activeNav === 'chat' || activeNav === 'teams');
                      return (
                        <button
                          key={channel.id}
                          onClick={() => {
                            setActiveChannel(channel.id);
                            setActiveNav('chat');
                            setMobileSidebarOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                            isActive
                              ? 'bg-purple-600/20 text-purple-200 font-semibold border-l-2 border-purple-500'
                              : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
                          }`}
                        >
                          {channel.isPrivate ? (
                            <Lock className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          ) : (
                            <Hash className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          )}
                          <span className="truncate flex-1 text-left">{channel.name}</span>
                          {channel.unreadCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-600 text-white">
                              {channel.unreadCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* DIRECT MESSAGES SECTION */}
                <div>
                  <div className="flex items-center justify-between px-2.5 mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                      Direct Messages
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {users.length}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    {directMessages.map((dm) => {
                      const otherUserId = dm.participantIds.includes(currentUser.id)
                        ? dm.participantIds.find((id) => id !== currentUser.id)
                        : dm.participantIds[1] || dm.participantIds[0];
                      const otherUser = users.find((u) => u.id === otherUserId);
                      const isActive =
                        dm.id === activeChannelId &&
                        (activeNav === 'chat' || activeNav === 'teams');

                      if (!otherUser) return null;

                      return (
                        <button
                          key={dm.id}
                          onClick={() => {
                            setActiveChannel(dm.id);
                            setActiveNav('chat');
                            setMobileSidebarOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ${
                            isActive
                              ? 'bg-purple-600/20 text-purple-200 font-semibold border-l-2 border-purple-500'
                              : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
                          }`}
                        >
                          <UserAvatar user={otherUser} size="xs" />
                          <span className="truncate flex-1 text-left">{otherUser.name}</span>
                          {otherUser.role === 'owner' && (
                            <span className="text-[9px] text-purple-400 font-mono">Owner</span>
                          )}
                          {otherUser.role === 'admin' && !otherUser.isBot && (
                            <span className="text-[9px] text-blue-400 font-mono">Admin</span>
                          )}
                          {dm.unreadCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-600 text-white">
                              {dm.unreadCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ACTIVE HUDDLE OR HUDDLE TRIGGER BAR */}
              {activeHuddle ? (
                <div className="p-3 mx-2 mb-2 rounded-lg bg-emerald-950/60 border border-emerald-700/50 text-emerald-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      <Headphones className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                      <span>Huddle in #{activeHuddle.channelName}</span>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {activeHuddle.participants.map((p) => (
                      <UserAvatar key={p.id} user={p} size="xs" showPresence={false} />
                    ))}
                  </div>
                  <button
                    onClick={endHuddle}
                    className="w-full py-1 text-xs font-semibold rounded bg-rose-600/80 hover:bg-rose-600 text-white transition-colors"
                  >
                    Leave Huddle
                  </button>
                </div>
              ) : (
                <div className="p-2 border-t border-slate-800/70 flex items-center justify-between">
                  <button
                    onClick={() => {
                      const targetChan =
                        channels.find((c) => c.id === activeChannelId) || channels[0];
                      if (targetChan) startHuddle(targetChan.id);
                    }}
                    className="flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md text-slate-300 hover:bg-slate-800/70 hover:text-white transition-colors"
                  >
                    <Headphones className="w-3.5 h-3.5 text-purple-400" />
                    <span>Start Huddle</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
