import React from 'react';
import { Mic, MicOff, Monitor, PhoneOff, Users } from 'lucide-react';
import { useCollabStore } from '../store/useCollabStore';
import { UserAvatar } from './UserAvatar';

export const HuddleFloatingBar: React.FC = () => {
  const { activeHuddle, toggleHuddleMute, toggleHuddleScreenshare, endHuddle } = useCollabStore();

  if (!activeHuddle) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-3 flex items-center gap-4 text-slate-100 backdrop-blur-md">
      {/* Channel info & audio waves */}
      <div className="flex items-center gap-2 pl-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-bold text-slate-100">
            Huddle: #{activeHuddle.channelName}
          </span>
        </div>

        {/* Audio active waves */}
        <div className="flex items-center gap-0.5 ml-2">
          <span className="w-1 h-3 bg-emerald-400 rounded-full animate-pulse" />
          <span className="w-1 h-5 bg-emerald-400 rounded-full animate-pulse [animation-delay:0.15s]" />
          <span className="w-1 h-2 bg-emerald-400 rounded-full animate-pulse [animation-delay:0.3s]" />
          <span className="w-1 h-4 bg-emerald-400 rounded-full animate-pulse [animation-delay:0.45s]" />
        </div>
      </div>

      {/* Participant Avatars */}
      <div className="flex -space-x-2 overflow-hidden px-1">
        {activeHuddle.participants.map((p) => (
          <UserAvatar
            key={p.id}
            user={p}
            size="sm"
            showPresence={false}
            className="ring-2 ring-slate-900"
          />
        ))}
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
        {/* Mute Button */}
        <button
          onClick={toggleHuddleMute}
          className={`p-2 rounded-xl transition-colors ${
            activeHuddle.isMuted
              ? 'bg-rose-600/20 text-rose-400 border border-rose-500/40 hover:bg-rose-600/30'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
          title={activeHuddle.isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {activeHuddle.isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Screen Share Button */}
        <button
          onClick={toggleHuddleScreenshare}
          className={`p-2 rounded-xl transition-colors ${
            activeHuddle.isScreenSharing
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
          title={activeHuddle.isScreenSharing ? 'Stop screen sharing' : 'Share screen'}
        >
          <Monitor className="w-4 h-4" />
        </button>

        {/* Leave Huddle Button */}
        <button
          onClick={endHuddle}
          className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-colors shadow-md shadow-rose-600/30"
          title="Leave huddle"
        >
          <PhoneOff className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
