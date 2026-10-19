import React from 'react';
import {
  Calendar as CalendarIcon,
  Video,
  CheckSquare,
  Clock,
  Sparkles,
  ArrowRight,
  Plus,
  Play,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Users,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';
import { useCollabStore } from '../../store/useCollabStore';
import { UserAvatar } from '../UserAvatar';
import {
  calculateTaskMetrics,
  getMeetingTimeStatus,
  generateDailyBrief,
  categorizeReminders,
} from '../../utils/collabSuiteLogic';
import {
  useLiveClock,
  getTodayDateStr,
  formatGreeting,
  formatHeaderDate,
  formatLiveTime,
} from '../../utils/dateClock';

export const HomeMyDayView: React.FC = () => {
  const {
    currentUser,
    calendarEvents,
    meetings,
    tasks,
    reminders,
    notifications,
    workspaceFiles,
    users,
    setActiveNav,
    joinMeeting,
    startInstantMeeting,
    toggleSubtask,
    updateTaskStatus,
    toggleReminderComplete,
    snoozeReminder,
    setQuickCreateOpen,
  } = useCollabStore();

  const liveClock = useLiveClock(1000);
  const todayStr = getTodayDateStr(liveClock);
  const todayEvents = calendarEvents.filter((e) => e.startDate === todayStr);

  // User tasks
  const myTasks = tasks.filter((t) => t.assigneeId === currentUser.id);
  const myPendingTasks = myTasks.filter((t) => t.status !== 'done');
  const overdueTasks = myTasks.filter((t) => t.status !== 'done' && t.dueDate < todayStr);

  const { overdue: overdueReminders, today: todayReminders } = categorizeReminders(
    reminders,
    liveClock.getTime()
  );
  const activeReminders = [...overdueReminders, ...todayReminders].filter((r) => !r.completed);

  // Daily brief generator
  const dailyBrief = generateDailyBrief(
    {
      userName: currentUser.name.split(' ')[0],
      meetingsTodayCount: todayEvents.length,
      tasksPendingCount: myPendingTasks.length,
      overdueTasksCount: overdueTasks.length,
      unreadMessagesCount: 5,
    },
    liveClock
  );

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6 text-slate-100">
      {/* HEADER & WELCOME */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <span>{formatGreeting(liveClock, currentUser.name.split(' ')[0])}</span>
            <span className="text-xl">✨</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
            <span>{formatHeaderDate(liveClock)}</span>
            <span>•</span>
            <span className="font-mono text-indigo-400 font-semibold">{formatLiveTime(liveClock)}</span>
            <span>•</span>
            <span>Here is your workspace briefing for today</span>
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => startInstantMeeting('Instant Ad-hoc Sync')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02]"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Instant Meeting</span>
          </button>
          <button
            onClick={() => setQuickCreateOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* AI DAILY BRIEF CARD */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900/90 to-purple-950/70 border border-indigo-500/30 shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-start gap-3.5 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shrink-0">
            <Sparkles className="w-5 h-5 text-indigo-300 animate-pulse" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                CollabFlow AI Daily Brief
              </span>
              <span className="text-[11px] text-slate-400">Updated just now</span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-white">
              {dailyBrief.headline}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              {dailyBrief.summary}
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-indigo-300 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <span>Recommended Focus: {dailyBrief.focusTip}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 STAT CHIPS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => setActiveNav('calendar')}
          className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all hover:bg-slate-900 group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Events Today</span>
            <CalendarIcon className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">{todayEvents.length}</div>
          <span className="text-[11px] text-slate-400">
            {todayEvents.length > 0 ? `Next at ${todayEvents[0].startTime}` : 'No events today'}
          </span>
        </div>

        <div
          onClick={() => setActiveNav('meetings')}
          className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-all hover:bg-slate-900 group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Upcoming Meetings</span>
            <Video className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">{meetings.length}</div>
          <span className="text-[11px] text-emerald-400 font-medium">Joinable online</span>
        </div>

        <div
          onClick={() => setActiveNav('tasks')}
          className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all hover:bg-slate-900 group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">My Open Tasks</span>
            <CheckSquare className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">{myPendingTasks.length}</div>
          <span className="text-[11px] text-amber-400 font-medium">
            {overdueTasks.length > 0 ? `${overdueTasks.length} overdue` : 'On track'}
          </span>
        </div>

        <div
          onClick={() => setActiveNav('reminders')}
          className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-pink-500/50 cursor-pointer transition-all hover:bg-slate-900 group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Reminders Due</span>
            <Clock className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">{activeReminders.length}</div>
          <span className="text-[11px] text-pink-400 font-medium">Actionable now</span>
        </div>
      </div>

      {/* TWO COLUMNS: LEFT (TODAY'S SCHEDULE & MEETINGS) & RIGHT (TASKS & REMINDERS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COLUMN 1: TODAY'S SCHEDULE & MEETINGS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Today's Schedule & Meetings
              </h2>
            </div>
            <button
              onClick={() => setActiveNav('calendar')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              <span>Full Calendar</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {todayEvents.map((evt) => {
              const linkedMeeting = meetings.find((m) => m.id === evt.meetingId);
              return (
                <div
                  key={evt.id}
                  className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-indigo-400">
                          {evt.startTime} - {evt.endTime}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                          {evt.category}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-100">{evt.title}</h3>
                      <p className="text-xs text-slate-400 line-clamp-1">{evt.description}</p>
                    </div>

                    {linkedMeeting && (
                      <button
                        onClick={() => joinMeeting(linkedMeeting.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0 shadow-md shadow-emerald-600/20 transition-all hover:scale-105"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Join</span>
                      </button>
                    )}
                  </div>

                  {/* Attendees Avatars */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1">
                      <span>Attendees:</span>
                      <div className="flex -space-x-1.5">
                        {evt.attendees.slice(0, 4).map((attId) => {
                          const user = users.find((u) => u.id === attId);
                          if (!user) return null;
                          return <UserAvatar key={attId} user={user} size="xs" showPresence={false} />;
                        })}
                      </div>
                    </div>
                    <span>{evt.location || 'Online'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMN 2: MY TASKS & DEADLINES */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                My Priority Tasks
              </h2>
            </div>
            <button
              onClick={() => setActiveNav('tasks')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              <span>Task Board</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {myTasks.slice(0, 4).map((task) => {
              const isOverdue = task.status !== 'done' && task.dueDate < todayStr;
              const isDone = task.status === 'done';

              return (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isDone
                      ? 'bg-slate-900/40 border-slate-800/50 opacity-75'
                      : isOverdue
                      ? 'bg-rose-950/20 border-rose-800/50'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <button
                      onClick={() =>
                        updateTaskStatus(task.id, isDone ? 'todo' : 'done')
                      }
                      className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors shrink-0"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <div className="w-4 h-4 rounded-md border-2 border-slate-600 hover:border-emerald-400" />
                      )}
                    </button>

                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-xs font-bold truncate ${
                            isDone ? 'line-through text-slate-500' : 'text-slate-100'
                          }`}
                        >
                          {task.title}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase shrink-0 ${
                            task.priority === 'urgent'
                              ? 'bg-rose-900/40 text-rose-300 border border-rose-700/60'
                              : task.priority === 'high'
                              ? 'bg-amber-900/40 text-amber-300 border border-amber-700/60'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-1">{task.description}</p>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                        <span className={isOverdue ? 'text-rose-400 font-bold' : ''}>
                          Due {task.dueDate} {isOverdue ? '• OVERDUE' : ''}
                        </span>
                        <span>
                          {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} subtasks
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* REMINDERS DUE SOON */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Clock className="w-3.5 h-3.5 text-pink-400" />
                <span>Reminders Due Soon</span>
              </div>
              <button
                onClick={() => setActiveNav('reminders')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
              >
                View all
              </button>
            </div>

            <div className="space-y-1.5">
              {activeReminders.slice(0, 2).map((rem) => (
                <div
                  key={rem.id}
                  className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <button
                      onClick={() => toggleReminderComplete(rem.id)}
                      className="text-slate-500 hover:text-emerald-400"
                    >
                      <div className="w-3.5 h-3.5 rounded border border-slate-500 hover:border-emerald-400" />
                    </button>
                    <span className="truncate text-slate-200">{rem.title}</span>
                  </div>
                  <button
                    onClick={() => snoozeReminder(rem.id, 60)}
                    className="text-[11px] text-pink-400 hover:text-pink-300 font-mono shrink-0"
                  >
                    +1h snooze
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RECENT FILES & WORKSPACE ACTIVITY */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Recent Workspace Documents & Assets
            </h2>
          </div>
          <button
            onClick={() => setActiveNav('files')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
          >
            All Files →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {workspaceFiles.slice(0, 3).map((f) => (
            <div
              key={f.id}
              onClick={() => setActiveNav('files')}
              className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-indigo-500/40 cursor-pointer transition-all flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800/40 flex items-center justify-center text-indigo-400 shrink-0 font-bold text-[10px] uppercase">
                {f.type.slice(0, 3)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-200 truncate">{f.name}</p>
                <p className="text-[10px] text-slate-500">{f.size} • {f.uploadedAt}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
