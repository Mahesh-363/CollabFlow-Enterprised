import React, { useState } from 'react';
import {
  Clock,
  Plus,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Check,
  Trash2,
  Sparkles,
  Link as LinkIcon,
  Search,
} from 'lucide-react';
import { useCollabStore } from '../../store/useCollabStore';
import { categorizeReminders } from '../../utils/collabSuiteLogic';

export const RemindersView: React.FC = () => {
  const {
    reminders,
    createReminder,
    toggleReminderComplete,
    snoozeReminder,
    deleteReminder,
    tasks,
    meetings,
  } = useCollabStore();

  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'overdue' | 'completed'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('2026-10-16');
  const [formTime, setFormTime] = useState('14:00');
  const [formPriority, setFormPriority] = useState<'low' | 'medium' | 'high'>('high');
  const [formLinkedType, setFormLinkedType] = useState<string>('none');

  const { overdue, today, upcoming, completed } = categorizeReminders(reminders);

  const getTabList = () => {
    switch (activeTab) {
      case 'today':
        return today;
      case 'upcoming':
        return upcoming;
      case 'overdue':
        return overdue;
      case 'completed':
        return completed;
      default:
        return today;
    }
  };

  const currentList = getTabList().filter((r) => {
    if (!searchQuery.trim()) return true;
    return r.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const dueAt = `${formDate}T${formTime}:00Z`;

    createReminder({
      title: formTitle.trim(),
      dueAt,
      priority: formPriority,
      linkedType: formLinkedType !== 'none' ? (formLinkedType as any) : undefined,
    });

    setIsCreateOpen(false);
    setFormTitle('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-5">
      {/* HEADER & QUICK ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-pink-400" />
            <span>Reminders & Smart Follow-ups</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Personal notifications, message follow-ups, and meeting alarms
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02] self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Reminder</span>
        </button>
      </div>

      {/* FILTER TABS & SEARCH */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'today' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Today ({today.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'upcoming' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Upcoming ({upcoming.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('overdue')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'overdue' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Overdue ({overdue.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'completed' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Completed</span>
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reminders..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* REMINDERS LIST */}
      {currentList.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
          <Clock className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No reminders in this view</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You are all caught up! Create a new reminder for pending code reviews, meetings, or tasks.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {currentList.map((rem) => {
            const isCompleted = rem.completed;
            const dueFormatted = new Date(rem.dueAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={rem.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isCompleted
                    ? 'bg-slate-900/30 border-slate-800/40 opacity-70'
                    : rem.priority === 'high'
                    ? 'bg-slate-900/90 border-slate-800 hover:border-pink-500/40'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    onClick={() => toggleReminderComplete(rem.id)}
                    className="mt-0.5 text-slate-500 hover:text-emerald-400 transition-colors shrink-0"
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-500 hover:border-emerald-400" />
                    )}
                  </button>

                  <div className="space-y-1 min-w-0">
                    <p
                      className={`text-xs sm:text-sm font-semibold truncate ${
                        isCompleted ? 'line-through text-slate-500' : 'text-slate-100'
                      }`}
                    >
                      {rem.title}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                      <span className="font-mono text-indigo-400">
                        Due: {new Date(rem.dueAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {dueFormatted}
                      </span>

                      {rem.linkedTitle && (
                        <span className="flex items-center gap-1 text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          <LinkIcon className="w-3 h-3 text-indigo-400" />
                          <span className="truncate max-w-[200px]">{rem.linkedTitle}</span>
                        </span>
                      )}

                      <span
                        className={`px-1.5 py-0.2 rounded font-bold uppercase text-[9px] ${
                          rem.priority === 'high'
                            ? 'bg-rose-950 text-rose-300'
                            : rem.priority === 'medium'
                            ? 'bg-amber-950 text-amber-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {rem.priority}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Snooze & Delete actions */}
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {!isCompleted && (
                    <>
                      <button
                        onClick={() => snoozeReminder(rem.id, 15)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors"
                      >
                        +15m
                      </button>
                      <button
                        onClick={() => snoozeReminder(rem.id, 60)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors"
                      >
                        +1h
                      </button>
                      <button
                        onClick={() => snoozeReminder(rem.id, 1440)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors"
                      >
                        Tomorrow
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => deleteReminder(rem.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                    title="Delete reminder"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE REMINDER MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-pink-400" />
                <span>Create New Reminder</span>
              </h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">What to remember *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Verify Redis consumer groups partition rebalance"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Due Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Due Time</label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Priority</label>
                <select
                  value={formPriority}
                  onChange={(e) => setFormPriority(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md shadow-indigo-600/30"
                >
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
