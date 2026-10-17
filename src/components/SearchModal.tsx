import React, { useState, useEffect } from 'react';
import { Search, X, Hash, Lock, MessageSquare, ArrowRight } from 'lucide-react';
import { useCollabStore } from '../store/useCollabStore';
import { searchMessages, formatMessageTime } from '../utils/collabLogic';
import { UserAvatar } from './UserAvatar';

export const SearchModal: React.FC = () => {
  const {
    isSearchOpen,
    setSearchOpen,
    messages,
    users,
    channels,
    activeChannelId,
    setActiveChannel,
    openThread,
  } = useCollabStore();

  const [query, setQuery] = useState('');
  const [filterChannelOnly, setFilterChannelOnly] = useState(false);

  // Map lookups
  const usersMap = Object.fromEntries(users.map((u) => [u.id, u]));
  const channelsMap = Object.fromEntries(channels.map((c) => [c.id, c]));

  // Listen for Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(!isSearchOpen);
      } else if (e.key === 'Escape' && isSearchOpen) {
        setSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setSearchOpen]);

  if (!isSearchOpen) return null;

  const results = searchMessages(
    messages,
    usersMap,
    channelsMap,
    query,
    filterChannelOnly ? activeChannelId : undefined
  );

  const handleSelectResult = (channelId: string, messageId: string) => {
    setActiveChannel(channelId);
    setSearchOpen(false);
    openThread(messageId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search messages, files, channels, or colleagues..."
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none"
            autoFocus
          />
          <button
            onClick={() => setSearchOpen(false)}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Chips */}
        <div className="px-4 py-2 border-b border-slate-800/60 bg-slate-950/40 flex items-center gap-2 text-xs">
          <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
            Filter:
          </span>
          <button
            onClick={() => setFilterChannelOnly(false)}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              !filterChannelOnly
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            All Workspaces
          </button>
          <button
            onClick={() => setFilterChannelOnly(true)}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              filterChannelOnly
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            Current Channel Only
          </button>
          <span className="ml-auto text-[11px] text-slate-500 font-mono">
            {results.length} {results.length === 1 ? 'match' : 'matches'}
          </span>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {query.trim() === '' ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              <Search className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
              <p>Type keywords to search across messages, code snippets, and attachments.</p>
              <p className="mt-1 text-slate-600">Try searching for &quot;Daphne&quot;, &quot;Kafka&quot;, or &quot;Redis&quot;</p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              <p>No messages found matching &quot;{query}&quot;</p>
            </div>
          ) : (
            results.map((msg) => {
              const author = usersMap[msg.userId] || users[0];
              const channel = channelsMap[msg.channelId];

              return (
                <div
                  key={msg.id}
                  onClick={() => handleSelectResult(msg.channelId, msg.id)}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/60 hover:bg-slate-800/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <UserAvatar user={author} size="xs" />
                      <span className="font-semibold text-xs text-slate-200">
                        {author.name}
                      </span>
                      {channel && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                          in {channel.isPrivate ? <Lock className="w-3 h-3" /> : <Hash className="w-3 h-3" />}
                          {channel.name}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formatMessageTime(msg.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {msg.content}
                  </p>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Jump to conversation and open thread</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
