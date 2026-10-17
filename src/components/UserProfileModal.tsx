import React, { useState } from 'react';
import { X, Shield, User as UserIcon, Check, Sparkles } from 'lucide-react';
import { useCollabStore } from '../store/useCollabStore';
import { UserAvatar } from './UserAvatar';
import { UserPresence } from '../types/collab';

export const UserProfileModal: React.FC = () => {
  const {
    isProfileOpen,
    setProfileOpen,
    users,
    currentUser,
    switchCurrentUser,
    updateUserPresence,
  } = useCollabStore();

  const [customStatus, setCustomStatus] = useState(currentUser.customStatus || '');

  if (!isProfileOpen) return null;

  const handleStatusSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserPresence(currentUser.presence, customStatus);
  };

  const presenceOptions: { value: UserPresence; label: string; dot: string }[] = [
    { value: 'online', label: 'Online', dot: 'bg-emerald-500' },
    { value: 'away', label: 'Away', dot: 'bg-amber-400' },
    { value: 'dnd', label: 'Do Not Disturb', dot: 'bg-rose-500' },
    { value: 'offline', label: 'Offline', dot: 'bg-slate-500' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-base text-slate-100">User Profile & RBAC Switcher</h3>
          </div>
          <button
            onClick={() => setProfileOpen(false)}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Current User Card */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-4">
            <UserAvatar user={currentUser} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-slate-100">{currentUser.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/60 font-mono uppercase font-bold">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{currentUser.title}</p>
              <p className="text-[11px] text-slate-500 font-mono">{currentUser.email}</p>
            </div>
          </div>

          {/* PRESENCE STATUS SELECTOR */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Set Real-Time Presence
            </label>
            <div className="grid grid-cols-2 gap-2">
              {presenceOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateUserPresence(opt.value)}
                  className={`flex items-center gap-2.5 p-2 rounded-lg text-xs font-medium border transition-all ${
                    currentUser.presence === opt.value
                      ? 'bg-slate-800 border-indigo-500 text-white ring-1 ring-indigo-500/50'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${opt.dot}`} />
                  <span>{opt.label}</span>
                  {currentUser.presence === opt.value && (
                    <Check className="w-3.5 h-3.5 text-indigo-400 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* CUSTOM STATUS */}
          <form onSubmit={handleStatusSave}>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Custom Status Message
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customStatus}
                onChange={(e) => setCustomStatus(e.target.value)}
                placeholder="What are you working on?"
                className="flex-1 px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
              >
                Update
              </button>
            </div>
          </form>

          {/* RBAC TESTER: SWITCH USER ACCOUNT */}
          <div className="pt-3 border-t border-slate-800">
            <div className="flex items-center gap-1.5 mb-2">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Switch Test Persona (Verify RBAC Live)
              </label>
            </div>
            <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
              Click any team member below to test role permissions across the application. Owners & Admins can delete any message and manage all channels; Members can edit/delete their own messages; Guests have read-only or restricted channel permissions.
            </p>

            <div className="space-y-2">
              {users.filter(u => !u.isBot).map((user) => {
                const isSelected = user.id === currentUser.id;
                return (
                  <button
                    key={user.id}
                    onClick={() => switchCurrentUser(user.id)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 text-white ring-1 ring-indigo-500/40'
                        : 'bg-slate-950/50 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <UserAvatar user={user} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-100">{user.name}</span>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          {user.role}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">{user.title}</div>
                    </div>
                    {isSelected && (
                      <span className="text-xs text-indigo-400 font-semibold flex items-center gap-1">
                        Active <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* AUTH SESSION & SIGN OUT */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
            <button
              onClick={() => {
                setProfileOpen(false);
                useCollabStore.getState().setAuthInspectorOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span>Auth & Tokens</span>
            </button>

            <button
              onClick={() => {
                setProfileOpen(false);
                useCollabStore.getState().logout();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 transition-colors"
            >
              <span>Sign Out to Auth Portal</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
