import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Video,
  Play,
  Users,
  Search,
  AlertTriangle,
  MapPin,
  Repeat,
  Trash2,
  Edit2,
  Check,
} from 'lucide-react';
import { useCollabStore } from '../../store/useCollabStore';
import { UserAvatar } from '../UserAvatar';
import { CalendarEvent } from '../../types/collab';
import { detectCalendarConflicts } from '../../utils/collabSuiteLogic';

export const CalendarView: React.FC = () => {
  const {
    calendarEvents,
    createCalendarEvent,
    deleteCalendarEvent,
    users,
    currentUser,
    joinMeeting,
    meetings,
  } = useCollabStore();

  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day' | 'agenda'>('month');
  const [selectedDate, setSelectedDate] = useState('2026-10-16');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formStartDate, setFormStartDate] = useState('2026-10-16');
  const [formStartTime, setFormStartTime] = useState('11:00');
  const [formEndTime, setFormEndTime] = useState('12:00');
  const [formAttendees, setFormAttendees] = useState<string[]>([currentUser.id]);
  const [formCategory, setFormCategory] = useState<CalendarEvent['category']>('meeting');
  const [formRecurrence, setFormRecurrence] = useState<CalendarEvent['recurrence']>('none');
  const [formLocation, setFormLocation] = useState('CollabFlow Video Room');

  // Filtered events
  const filteredEvents = calendarEvents.filter((e) => {
    if (selectedCategory !== 'all' && e.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!e.title.toLowerCase().includes(q) && !e.description.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  // Check conflicts for the active event form
  const conflicts = isEventModalOpen
    ? detectCalendarConflicts(calendarEvents, {
        startDate: formStartDate,
        startTime: formStartTime,
        endTime: formEndTime,
        attendees: formAttendees,
      })
    : [];

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    createCalendarEvent({
      title: formTitle.trim(),
      description: formDesc.trim(),
      startDate: formStartDate,
      startTime: formStartTime,
      endDate: formStartDate,
      endTime: formEndTime,
      allDay: false,
      attendees: formAttendees,
      category: formCategory,
      recurrence: formRecurrence,
      location: formLocation,
      reminderMinutes: 15,
      color:
        formCategory === 'meeting'
          ? '#6366f1'
          : formCategory === 'deadline'
          ? '#f59e0b'
          : formCategory === 'review'
          ? '#ec4899'
          : '#10b981',
    });

    setIsEventModalOpen(false);
    setFormTitle('');
    setFormDesc('');
  };

  // Month days generation for October 2026 (Starts on Thursday Oct 1)
  const monthDays = Array.from({ length: 31 }, (_, i) => {
    const day = i + 1;
    const dateStr = `2026-10-${day < 10 ? '0' + day : day}`;
    const dayEvents = filteredEvents.filter((ev) => ev.startDate === dateStr);
    return { day, dateStr, dayEvents, isToday: dateStr === '2026-10-16' };
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-5">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-indigo-400" />
            <span>Integrated Calendar</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Connected with video meetings, task deadlines, and team availability
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Today Jump Button */}
          <button
            onClick={() => setSelectedDate('2026-10-16')}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Today
          </button>

          {/* Create Event Trigger */}
          <button
            onClick={() => setIsEventModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </button>
        </div>
      </div>

      {/* VIEW SWITCHER & FILTER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Month/Week/Day/Agenda switcher */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            {(['month', 'week', 'day', 'agenda'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setCurrentView(view)}
                className={`px-3 py-1.5 rounded-lg font-semibold uppercase text-[11px] tracking-wider transition-colors ${
                  currentView === view
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {view}
              </button>
            ))}
          </div>

          <span className="text-sm font-bold text-white px-2">
            October 2026
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
          >
            <option value="all">All Categories</option>
            <option value="meeting">Meetings</option>
            <option value="deadline">Deadlines</option>
            <option value="review">Reviews</option>
            <option value="focus">Focus Blocks</option>
          </select>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter events..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* MONTH VIEW GRID */}
      {currentView === 'month' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-xl">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-900/90 text-[11px] font-bold text-slate-400 uppercase py-2.5 text-center">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days Grid: Oct 1 2026 is Thursday (4 empty cells before it) */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-800/60 min-h-[500px]">
            {/* Empty offset days */}
            <div className="p-2 bg-slate-950/40" />
            <div className="p-2 bg-slate-950/40" />
            <div className="p-2 bg-slate-950/40" />
            <div className="p-2 bg-slate-950/40" />

            {monthDays.map((d) => (
              <div
                key={d.day}
                onClick={() => setSelectedDate(d.dateStr)}
                className={`p-2 min-h-[90px] transition-colors cursor-pointer flex flex-col justify-between ${
                  d.isToday
                    ? 'bg-indigo-950/30 ring-1 ring-inset ring-indigo-500/50'
                    : selectedDate === d.dateStr
                    ? 'bg-slate-800/40'
                    : 'hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      d.isToday ? 'bg-indigo-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    {d.day}
                  </span>
                  {d.dayEvents.length > 0 && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      {d.dayEvents.length} event{d.dayEvents.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  {d.dayEvents.slice(0, 2).map((ev) => (
                    <div
                      key={ev.id}
                      className="px-1.5 py-0.5 rounded text-[10px] font-semibold truncate border border-transparent"
                      style={{
                        backgroundColor: `${ev.color || '#6366f1'}25`,
                        color: ev.color || '#818cf8',
                        borderColor: `${ev.color || '#6366f1'}40`,
                      }}
                    >
                      {ev.startTime} {ev.title}
                    </div>
                  ))}
                  {d.dayEvents.length > 2 && (
                    <span className="text-[10px] text-indigo-400 font-medium pl-1">
                      +{d.dayEvents.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AGENDA / LIST VIEW & DAY VIEW */}
      {(currentView === 'agenda' || currentView === 'week' || currentView === 'day') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Scheduled Agenda & Events ({filteredEvents.length})
            </h2>
          </div>

          <div className="space-y-2.5">
            {filteredEvents.map((ev) => {
              const meeting = meetings.find((m) => m.id === ev.meetingId);

              return (
                <div
                  key={ev.id}
                  className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-400 font-mono">
                        {ev.startDate} • {ev.startTime} - {ev.endTime}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-slate-800 text-slate-300">
                        {ev.category}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white">{ev.title}</h3>
                    <p className="text-xs text-slate-400">{ev.description}</p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{ev.location || 'Online'}</span>
                      </span>
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{ev.attendees.length} attendees</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {meeting && (
                      <button
                        onClick={() => joinMeeting(meeting.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Join Call</span>
                      </button>
                    )}

                    <button
                      onClick={() => deleteCalendarEvent(ev.id)}
                      className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Delete event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CREATE EVENT MODAL */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-indigo-400" />
                <span>Create Calendar Event</span>
              </h2>
              <button
                onClick={() => setIsEventModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* Conflict Warning */}
            {conflicts.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 flex items-start gap-2.5 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Schedule Conflict Detected: </span>
                  <span>
                    Overlaps with "{conflicts[0].title}" ({conflicts[0].startTime} - {conflicts[0].endTime}) for shared attendees.
                  </span>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateEvent} className="space-y-3.5">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Mediasoup SFU Performance Benchmark"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Event agenda and materials"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Date</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Start Time</label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">End Time</label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="meeting">Meeting</option>
                    <option value="review">Review</option>
                    <option value="deadline">Deadline</option>
                    <option value="focus">Focus Block</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Recurrence</label>
                  <select
                    value={formRecurrence}
                    onChange={(e) => setFormRecurrence(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="none">Does not repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Attendees</label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-950 rounded-xl border border-slate-800">
                  {users.map((u) => {
                    const isSelected = formAttendees.includes(u.id);
                    return (
                      <button
                        type="button"
                        key={u.id}
                        onClick={() => {
                          setFormAttendees((prev) =>
                            isSelected ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                          );
                        }}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 text-white font-semibold'
                            : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <UserAvatar user={u} size="xs" showPresence={false} />
                        <span>{u.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md shadow-indigo-600/30"
                >
                  Add to Calendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
