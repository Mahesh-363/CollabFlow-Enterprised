import React, { useState } from 'react';
import { X, Send, Smile, MessageSquare } from 'lucide-react';
import { useCollabStore } from '../store/useCollabStore';
import { UserAvatar } from './UserAvatar';
import { formatMessageTime } from '../utils/collabLogic';

const QUICK_EMOJIS = ['👍', '❤️', '🔥', '🚀', '🙌', '🎯', '🧠'];

export const ThreadPanel: React.FC = () => {
  const {
    activeThreadMessageId,
    closeThread,
    messages,
    threadReplies,
    sendThreadReply,
    toggleThreadReaction,
    users,
    currentUser,
    channels,
  } = useCollabStore();

  const [replyText, setReplyText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);

  if (!activeThreadMessageId) return null;

  const rootMessage = messages.find((m) => m.id === activeThreadMessageId);
  if (!rootMessage) return null;

  const rootAuthor = users.find((u) => u.id === rootMessage.userId) || users[0];
  const replies = threadReplies[activeThreadMessageId] || [];
  const channel = channels.find((c) => c.id === rootMessage.channelId);

  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('• ');
      const cleanLine = isBullet ? line.trim().substring(2) : line;
      const parts = cleanLine.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

      return (
        <div key={lineIdx} className={`${isBullet ? 'flex items-start gap-1.5 pl-1.5 my-0.5' : ''}`}>
          {isBullet && <span className="text-slate-400 select-none">•</span>}
          <div>
            {parts.map((part, partIdx) => {
              if (part.startsWith('`') && part.endsWith('`')) {
                return (
                  <code key={partIdx} className="font-mono text-[11px] bg-slate-800 text-indigo-300 px-1 py-0.2 rounded border border-slate-700">
                    {part.slice(1, -1)}
                  </code>
                );
              }
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <strong key={partIdx} className="font-semibold text-slate-100">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return <span key={partIdx}>{part}</span>;
            })}
          </div>
        </div>
      );
    });
  };

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    sendThreadReply(activeThreadMessageId, replyText.trim());
    setReplyText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  return (
    <aside className="w-96 border-l border-slate-800/80 bg-slate-900/95 flex flex-col h-full shrink-0 shadow-2xl z-20">
      {/* Header */}
      <div className="h-14 px-4 border-b border-slate-800/80 flex items-center justify-between shrink-0 bg-slate-900">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <span className="font-bold text-sm text-slate-100">Thread</span>
          {channel && (
            <span className="text-xs text-slate-400 font-mono">
              #{channel.name}
            </span>
          )}
        </div>
        <button
          onClick={closeThread}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          title="Close thread"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ROOT MESSAGE */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
          <div className="flex items-start gap-2.5">
            <UserAvatar user={rootAuthor} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-xs text-slate-200">
                  {rootAuthor.name}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {formatMessageTime(rootMessage.createdAt)}
                </span>
              </div>
              <div className="text-xs text-slate-300 mt-1 leading-relaxed">
                {renderFormattedText(rootMessage.content)}
              </div>
            </div>
          </div>
        </div>

        {/* REPLIES DIVIDER */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-[1px] bg-slate-800" />
          <span className="text-[11px] font-semibold text-slate-400 font-mono">
            {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
          </span>
          <div className="flex-1 h-[1px] bg-slate-800" />
        </div>

        {/* THREAD REPLIES LIST */}
        <div className="space-y-3">
          {replies.map((reply) => {
            const author = users.find((u) => u.id === reply.userId) || users[0];
            return (
              <div key={reply.id} className="group flex items-start gap-2.5">
                <UserAvatar user={author} size="xs" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-xs text-slate-200">
                      {author.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formatMessageTime(reply.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5 whitespace-pre-wrap leading-relaxed">
                    {reply.content}
                  </p>

                  {/* Reply Reactions */}
                  {reply.reactions.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {reply.reactions.map((r) => {
                        const userReacted = r.users.includes(currentUser.id);
                        return (
                          <button
                            key={r.emoji}
                            onClick={() => toggleThreadReaction(reply.id, r.emoji)}
                            className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] ${
                              userReacted
                                ? 'bg-indigo-950 border border-indigo-500 text-indigo-300'
                                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <span>{r.emoji}</span>
                            <span className="font-mono">{r.count}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Quick emoji on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex items-center gap-1">
                    {QUICK_EMOJIS.slice(0, 4).map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => toggleThreadReaction(reply.id, emoji)}
                        className="text-xs hover:scale-125 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* THREAD REPLY INPUT */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900 shrink-0">
        <div className="bg-slate-950 border border-slate-700 rounded-lg p-2 focus-within:border-indigo-500 transition-colors">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Reply to thread..."
            rows={2}
            className="w-full text-xs bg-transparent text-slate-100 placeholder-slate-500 resize-none focus:outline-none"
          />
          <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 mt-1">
            <div className="flex items-center gap-1">
              {QUICK_EMOJIS.slice(0, 3).map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setReplyText((prev) => prev + emoji)}
                  className="text-xs hover:scale-110 transition-transform p-0.5"
                >
                  {emoji}
                </button>
              ))}
            </div>

            <button
              onClick={handleSendReply}
              disabled={!replyText.trim()}
              className={`p-1 rounded-md text-xs font-medium transition-colors ${
                replyText.trim()
                  ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                  : 'text-slate-600 cursor-not-allowed'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
