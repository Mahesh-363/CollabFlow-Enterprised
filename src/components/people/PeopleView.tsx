import React, { useState } from 'react';
import {
  Users,
  Search,
  MessageSquare,
  Video,
  CheckSquare,
  Shield,
  Mail,
  UserCheck,
  Building,
} from 'lucide-react';
import { useCollabStore } from '../../store/useCollabStore';
import { UserAvatar } from '../UserAvatar';
import { User, UserRole, UserPresence } from '../../types/collab';

export const PeopleView: React.FC = () => {
  const {
    users,
    currentUser,
    directMessages,
    setActiveChannel,
    setActiveNav,
    scheduleMeeting,
    startInstantMeeting,
    tasks,
    workspaces,
    activeWorkspaceId,
  } = useCollabStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterPresence, setFilterPresence] = useState<string>('all');

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  const filteredUsers = users.filter((u) => {
    if (filterRole !== 'all' && u.role !== filterRole) return false;
    if (filterPresence !== 'all' && u.presence !== filterPresence) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!u.name.toLowerCase().includes(q) && !u.title.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const handleStartDM = (targetUserId: string) => {
    const existingDm = directMessages.find(
      (dm) =>
        dm.participantIds.includes(currentUser.id) && dm.participantIds.includes(targetUserId)
    );

    if (existingDm) {
      setActiveChannel(existingDm.id);
    } else if (directMessages.length > 0) {
      setActiveChannel(directMessages[0].id);
    }
    setActiveNav('chat');
  };

  const handleStartInstantCallWith = (user: User) => {
    startInstantMeeting(`1:1 Call: ${currentUser.name} & ${user.name}`);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-5">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-indigo-400" />
            <span>People & Workspace Directory</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {activeWorkspace.name} • {users.length} teammates and collaborators
          </p>
        </div>
      </div>

      {/* FILTER TABS & SEARCH */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Role filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
          >
            <option value="all">All Roles</option>
            <option value="owner">Owners</option>
            <option value="admin">Admins</option>
            <option value="member">Members</option>
            <option value="guest">Guests</option>
          </select>

          {/* Presence filter */}
          <select
            value={filterPresence}
            onChange={(e) => setFilterPresence(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
          >
            <option value="all">All Presence Statuses</option>
            <option value="online">Online</option>
            <option value="away">Away</option>
            <option value="dnd">Do Not Disturb</option>
            <option value="offline">Offline</option>
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, role, email..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* PEOPLE DIRECTORY GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => {
          const userTasks = tasks.filter((t) => t.assigneeId === user.id);
          const isCurrentUser = user.id === currentUser.id;

          return (
            <div
              key={user.id}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 group shadow-md"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <UserAvatar user={user} size="lg" />
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center gap-1.5">
                        <span>{user.name}</span>
                        {isCurrentUser && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                            You
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-400">{user.title}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                      user.role === 'owner'
                        ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                        : user.role === 'admin'
                        ? 'bg-blue-950 text-blue-300 border border-blue-800'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {user.role}
                  </span>
                </div>

                {user.customStatus && (
                  <p className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-300 italic">
                    "{user.customStatus}"
                  </p>
                )}

                <div className="space-y-1 text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-3.5 h-3.5 text-slate-500" />
                    <span>{userTasks.length} active tasks assigned</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center gap-2 text-xs">
                <button
                  onClick={() => handleStartDM(user.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/40 text-indigo-200 hover:text-white font-semibold transition-all"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Send Message</span>
                </button>

                {!isCurrentUser && (
                  <button
                    onClick={() => handleStartInstantCallWith(user)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 transition-colors"
                    title={`Start 1:1 call with ${user.name}`}
                  >
                    <Video className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
