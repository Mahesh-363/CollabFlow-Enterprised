import React, { useState } from 'react';
import { Hash, Lock, X, AlertCircle } from 'lucide-react';
import { useCollabStore } from '../store/useCollabStore';
import { canCreateChannel } from '../utils/collabLogic';

export const CreateChannelModal: React.FC = () => {
  const { isCreateChannelOpen, setCreateChannelOpen, createChannel, currentUser } = useCollabStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState('');

  if (!isCreateChannelOpen) return null;

  const hasPermission = canCreateChannel(currentUser);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission) {
      setError('Guest accounts do not have permission to create channels.');
      return;
    }
    const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    if (!cleanName) {
      setError('Channel name is required.');
      return;
    }

    createChannel(cleanName, description.trim(), topic.trim(), isPrivate);
    setName('');
    setDescription('');
    setTopic('');
    setIsPrivate(false);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400">
              <Hash className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-slate-100">Create a channel</h3>
          </div>
          <button
            onClick={() => setCreateChannelOpen(false)}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {!hasPermission && (
            <div className="p-3 rounded-lg bg-amber-950/60 border border-amber-800 text-amber-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>You are currently testing as a <strong>Guest</strong>. Switch to <strong>Admin</strong> or <strong>Owner</strong> in profile settings to create channels.</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Channel Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Name
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-500 font-mono text-sm">#</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. data-pipeline-alerts"
                className="w-full pl-8 pr-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Channels are where your team communicates. They are best organized around a topic (e.g. #deployments).
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Description <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this channel about?"
              rows={2}
              className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Topic */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Topic <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Real-time telemetry monitoring and SLAs"
              className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Private Channel Toggle */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <div className="font-semibold text-xs text-slate-200">Make private</div>
                <div className="text-[11px] text-slate-500">
                  When a channel is private, it can only be viewed or joined by invitation.
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
            </label>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateChannelOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!hasPermission || !name.trim()}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                hasPermission && name.trim()
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              Create Channel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
