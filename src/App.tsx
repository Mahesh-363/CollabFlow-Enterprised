/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { ThreadPanel } from './components/ThreadPanel';
import { SearchModal } from './components/SearchModal';
import { CreateChannelModal } from './components/CreateChannelModal';
import { UserProfileModal } from './components/UserProfileModal';
import { ArchitectureExplorerModal } from './components/ArchitectureExplorerModal';
import { PresenceInspectorModal } from './components/PresenceInspectorModal';
import { HuddleFloatingBar } from './components/HuddleFloatingBar';
import { ToastNotification } from './components/ToastNotification';
import { AuthPage } from './components/auth/AuthPage';
import { AuthInspectorModal } from './components/auth/AuthInspectorModal';
import { BreakGameModal } from './components/game/BreakGameModal';
import { TopNavBar } from './components/navigation/TopNavBar';
import { HomeMyDayView } from './components/home/HomeMyDayView';
import { MeetingsView } from './components/meetings/MeetingsView';
import { CalendarView } from './components/calendar/CalendarView';
import { TasksView } from './components/tasks/TasksView';
import { RemindersView } from './components/reminders/RemindersView';
import { NotificationsView } from './components/notifications/NotificationsView';
import { FilesView } from './components/files/FilesView';
import { PeopleView } from './components/people/PeopleView';
import { AIAssistantView } from './components/ai/AIAssistantView';
import { WorkspaceSettingsView } from './components/settings/WorkspaceSettingsView';
import { QuickCreateModal } from './components/modals/QuickCreateModal';
import { HelpSupportModal } from './components/modals/HelpSupportModal';
import { useCollabStore } from './store/useCollabStore';

export default function App() {
  const {
    theme,
    isAuthView,
    isRestoringSession,
    restoreSession,
    activeNav,
    recordUserActivity,
    checkInactivityTimer,
  } = useCollabStore();

  // Restore authenticated session on app load before rendering auth screen
  React.useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Real-time user activity & inactivity decay timer
  React.useEffect(() => {
    let debounceTimer: NodeJS.Timeout | null = null;
    const handleActivity = () => {
      if (debounceTimer) return;
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        recordUserActivity();
      }, 500);
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('focus', handleActivity);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        recordUserActivity();
      }
    });

    // Check inactivity every 5 seconds
    const interval = setInterval(() => {
      checkInactivityTimer();
    }, 5000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('focus', handleActivity);
      clearInterval(interval);
    };
  }, [recordUserActivity, checkInactivityTimer]);

  const themeClass = {
    slack: 'bg-slate-950 text-slate-100',
    teams: 'bg-[#1b1c24] text-slate-100',
    midnight: 'bg-black text-neutral-100',
    light: 'bg-slate-50 text-slate-900',
  }[theme];

  // While restoring session from storage or backend, show a short loading state (not login screen)
  if (isRestoringSession) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0a0d14] text-slate-100 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-slate-300">Restoring session...</p>
          </div>
        </div>
      </div>
    );
  }

  // If user is in authentication / onboarding mode
  if (isAuthView) {
    return (
      <div className="min-h-screen w-full overflow-y-auto overflow-x-hidden bg-[#0a0d14] text-slate-100 font-sans">
        <AuthPage />
        <PresenceInspectorModal />
        <ArchitectureExplorerModal />
        <AuthInspectorModal />
        <BreakGameModal />
        <ToastNotification />
      </div>
    );
  }

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${themeClass} font-sans`}>
      {/* LEFT NAVIGATION RAIL + OPTIONAL CHANNELS/DM SIDEBAR */}
      <Sidebar />

      {/* RIGHT MAIN WORKSPACE CANVAS */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* GLOBAL TOP NAVIGATION BAR */}
        <TopNavBar />

        {/* DYNAMIC VIEW ROUTER */}
        <div className="flex-1 flex min-h-0 min-w-0 overflow-hidden relative">
          {activeNav === 'home' && <HomeMyDayView />}
          {(activeNav === 'chat' || activeNav === 'teams') && (
            <>
              <ChatArea />
              <ThreadPanel />
            </>
          )}
          {activeNav === 'meetings' && <MeetingsView />}
          {activeNav === 'calendar' && <CalendarView />}
          {activeNav === 'tasks' && <TasksView />}
          {activeNav === 'reminders' && <RemindersView />}
          {activeNav === 'notifications' && <NotificationsView />}
          {activeNav === 'files' && <FilesView />}
          {activeNav === 'people' && <PeopleView />}
          {activeNav === 'ai' && <AIAssistantView />}
          {activeNav === 'settings' && <WorkspaceSettingsView />}
        </div>
      </div>

      {/* FLOATING HUDDLE AUDIO BAR */}
      <HuddleFloatingBar />

      {/* REAL-TIME TOAST NOTIFICATIONS */}
      <ToastNotification />

      {/* MODALS */}
      <QuickCreateModal />
      <SearchModal />
      <CreateChannelModal />
      <UserProfileModal />
      <PresenceInspectorModal />
      <ArchitectureExplorerModal />
      <AuthInspectorModal />
      <BreakGameModal />
      <HelpSupportModal />
    </div>
  );
}
