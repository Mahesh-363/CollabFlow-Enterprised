import React, { useState } from 'react';
import {
  Video,
  Plus,
  Calendar,
  Clock,
  Play,
  Copy,
  Check,
  Users,
  Search,
  ExternalLink,
  Shield,
  FileText,
} from 'lucide-react';
import { useCollabStore } from '../../store/useCollabStore';
import { MeetingRoom } from './MeetingRoom';
import { UserAvatar } from '../UserAvatar';
import { getMeetingTimeStatus } from '../../utils/collabSuiteLogic';
import { getTodayDateStr } from '../../utils/dateClock';

export const MeetingsView: React.FC = () => {
  const {
    meetings,
    users,
    currentUser,
    isInMeetingRoom,
    joinMeeting,
    startInstantMeeting,
    scheduleMeeting,
  } = useCollabStore();

  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state for scheduling new meeting
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDate, setFormDate] = useState(() => getTodayDateStr());
  const [formTime, setFormTime] = useState('11:00');
  const [formDuration, setFormDuration] = useState(45);
  const [formParticipants, setFormParticipants] = useState<string[]>([currentUser.id]);
  const [formAgenda, setFormAgenda] = useState('');

  // If currently in a live meeting room, render the interactive video room!
  if (isInMeetingRoom) {
    return <MeetingRoom />;
  }

  const filteredMeetings = meetings.filter((m) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!m.title.toLowerCase().includes(q) && !m.description.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (activeTab === 'upcoming') {
      return m.status === 'scheduled' || m.status === 'live';
    }
    if (activeTab === 'past') {
      return m.status === 'completed' || m.status === 'cancelled';
    }
    return true;
  });

  const handleCopyLink = (mId: string, link: string) => {
    navigator.clipboard?.writeText(link);
    setCopiedId(mId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmitSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const scheduledAt = `${formDate}T${formTime}:00Z`;
    scheduleMeeting({
      title: formTitle.trim(),
      description: formDesc.trim(),
      scheduledAt,
      durationMinutes: formDuration,
      hostId: currentUser.id,
      participantIds: formParticipants,
      agenda: formAgenda.trim(),
    });

    setIsScheduleModalOpen(false);
    setFormTitle('');
    setFormDesc('');
    setFormAgenda('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* HEADER & TOP ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Video className="w-6 h-6 text-emerald-400" />
            <span>CollabFlow Meetings & Calls</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Enterprise video, crystal-clear WebRTC audio, screen sharing, and scheduled conferences
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => startInstantMeeting('Instant Ad-hoc Sync')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02]"
          >
            <Video className="w-4 h-4" />
            <span>Start Instant Meeting</span>
          </button>

          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Meeting</span>
          </button>
        </div>
      </div>

      {/* SEARCH & FILTER TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === 'upcoming' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Upcoming & Live ({meetings.filter((m) => m.status === 'scheduled' || m.status === 'live').length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === 'past' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Past & Cancelled
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Meetings
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search meetings by title..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
          />
        </div>
      </div>

      {/* MEETINGS GRID */}
      {filteredMeetings.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
          <Video className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No meetings found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            There are no meetings matching your filter. Start an instant video room or schedule one for your team.
          </p>
          <button
            onClick={() => startInstantMeeting()}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
          >
            Start Instant Meeting
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMeetings.map((meeting) => {
            const timeStatus = getMeetingTimeStatus(meeting);
            const host = users.find((u) => u.id === meeting.hostId);
            const isCopied = copiedId === meeting.id;

            return (
              <div
                key={meeting.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 group shadow-md"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        meeting.status === 'live'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                          : 'bg-indigo-950 text-indigo-300 border border-indigo-800/60'
                      }`}
                    >
                      {timeStatus.statusLabel}
                    </span>

                    <span className="text-xs font-mono text-slate-400">
                      {meeting.durationMinutes} mins
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {meeting.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {meeting.description || 'No description provided.'}
                    </p>
                  </div>

                  {meeting.agenda && (
                    <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-300 line-clamp-2">
                      <span className="font-semibold text-slate-400">Agenda: </span>
                      {meeting.agenda}
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      {host && <UserAvatar user={host} size="xs" showPresence={false} />}
                      <span className="truncate max-w-[120px]">Host: {host?.name.split(' ')[0]}</span>
                    </div>

                    <div className="flex -space-x-1.5">
                      {meeting.participantIds.slice(0, 3).map((pId) => {
                        const u = users.find((x) => x.id === pId);
                        if (!u) return null;
                        return <UserAvatar key={pId} user={u} size="xs" showPresence={false} />;
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => joinMeeting(meeting.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02]"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Join Meeting</span>
                    </button>

                    <button
                      onClick={() => handleCopyLink(meeting.id, meeting.meetingLink)}
                      title="Copy join link"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    >
                      {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SCHEDULE MEETING MODAL */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Video className="w-4 h-4 text-indigo-400" />
                <span>Schedule Video Meeting</span>
              </h2>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitSchedule} className="space-y-3.5">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Meeting Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Sprint 43 Backlog Refinement"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Brief context or goals for participants"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Start Time</label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Duration</label>
                  <select
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value={15}>15 mins</option>
                    <option value={30}>30 mins</option>
                    <option value={45}>45 mins</option>
                    <option value={60}>60 mins</option>
                    <option value={90}>90 mins</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Agenda / Action Points</label>
                <textarea
                  rows={2}
                  value={formAgenda}
                  onChange={(e) => setFormAgenda(e.target.value)}
                  placeholder="1. Topic A&#10;2. Topic B"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Invite Team Members</label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-950 rounded-xl border border-slate-800">
                  {users.map((u) => {
                    const isSelected = formParticipants.includes(u.id);
                    return (
                      <button
                        type="button"
                        key={u.id}
                        onClick={() => {
                          setFormParticipants((prev) =>
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
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md shadow-indigo-600/30"
                >
                  Confirm & Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
