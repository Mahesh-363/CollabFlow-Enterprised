import React, { useState } from 'react';
import {
  CheckSquare,
  Calendar,
  Clock,
  Video,
  X,
} from 'lucide-react';
import { useCollabStore } from '../../store/useCollabStore';

export const QuickCreateModal: React.FC = () => {
  const {
    isQuickCreateOpen,
    setQuickCreateOpen,
    createTask,
    createCalendarEvent,
    createReminder,
    startInstantMeeting,
    currentUser,
  } = useCollabStore();

  const [activeType, setActiveType] = useState<'task' | 'event' | 'reminder'>('task');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState('2026-10-16');
  const [time, setTime] = useState('14:00');

  if (!isQuickCreateOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (activeType === 'task') {
      createTask({
        title: title.trim(),
        description: desc.trim(),
        status: 'todo',
        priority: 'high',
        assigneeId: currentUser.id,
        creatorId: currentUser.id,
        dueDate: date,
        tags: ['QuickCreate'],
        subtasks: [],
      });
    } else if (activeType === 'event') {
      createCalendarEvent({
        title: title.trim(),
        description: desc.trim(),
        startDate: date,
        startTime: time,
        endDate: date,
        endTime: '15:00',
        attendees: [currentUser.id],
        category: 'meeting',
        reminderMinutes: 15,
        location: 'CollabFlow Video Room',
      });
    } else if (activeType === 'reminder') {
      createReminder({
        title: title.trim(),
        dueAt: `${date}T${time}:00Z`,
        priority: 'high',
      });
    }

    setQuickCreateOpen(false);
    setTitle('');
    setDesc('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-base font-bold text-white">Quick Create Item</h2>
          <button
            onClick={() => setQuickCreateOpen(false)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Item Type Selector */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveType('task')}
            className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 font-semibold transition-all ${
              activeType === 'task'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            <CheckSquare className="w-4 h-4 text-amber-400" />
            <span>Task</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveType('event')}
            className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 font-semibold transition-all ${
              activeType === 'event'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span>Event</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveType('reminder')}
            className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 font-semibold transition-all ${
              activeType === 'reminder'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4 text-pink-400" />
            <span>Reminder</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Title for this ${activeType}...`}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Details (optional)</label>
            <textarea
              rows={2}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Context or notes..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setQuickCreateOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md shadow-indigo-600/30"
            >
              Create {activeType.charAt(0).toUpperCase() + activeType.slice(1)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
