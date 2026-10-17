import React, { useState } from 'react';
import {
  Smile,
  MessageSquare,
  MoreHorizontal,
  Edit2,
  Trash2,
  Pin,
  FileCode,
  Download,
  Check,
  X,
} from 'lucide-react';
import { Message, User } from '../types/collab';
import { useCollabStore } from '../store/useCollabStore';
import { UserAvatar } from './UserAvatar';
import { canDeleteMessage, canEditMessage, formatMessageTime } from '../utils/collabLogic';

interface MessageItemProps {
  message: Message;
  author: User;
  isCompact?: boolean;
}

const QUICK_EMOJIS = ['👍', '❤️', '🚀', '🔥', '👀', '🎉', '💯', '👏', '🙌', '✨', '💡', '⚡', '✅', '😂'];

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  author,
  isCompact = false,
}) => {
  const {
    currentUser,
    toggleReaction,
    openThread,
    editMessage,
    deleteMessage,
    users,
  } = useCollabStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const canEdit = canEditMessage(currentUser, message);
  const canDelete = canDeleteMessage(currentUser, message);

  const handleSaveEdit = () => {
    if (editContent.trim()) {
      editMessage(message.id, editContent);
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditContent(message.content);
    }
  };

  const renderContent = (text: string) => {
    // Basic markdown formatting: bold, code blocks, inline code
    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      // Check for bullet list
      const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('• ');
      const cleanLine = isBullet ? line.trim().substring(2) : line;

      // Inline code and bold parsing
      const parts = cleanLine.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

      return (
        <div key={lineIdx} className={`${isBullet ? 'flex items-start gap-2 pl-2 my-0.5' : ''}`}>
          {isBullet && <span className="text-slate-400 mt-1 select-none">•</span>}
          <div>
            {parts.map((part, partIdx) => {
              if (part.startsWith('`') && part.endsWith('`')) {
                return (
                  <code
                    key={partIdx}
                    className="font-mono text-xs bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded border border-slate-700"
                  >
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

  return (
    <div
      className={`group relative px-6 py-2 transition-colors hover:bg-slate-800/30 ${
        message.pinned ? 'bg-indigo-950/20 border-l-2 border-indigo-500' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Author Avatar */}
        <div className="mt-0.5">
          <UserAvatar user={author} size="md" />
        </div>

        {/* Message Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-semibold text-sm text-slate-100 hover:underline cursor-pointer">
              {author.name}
            </span>

            {/* Role Badge */}
            {author.role === 'owner' && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/60 font-mono">
                Owner
              </span>
            )}
            {author.role === 'admin' && !author.isBot && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-700/60 font-mono">
                Admin
              </span>
            )}
            {author.role === 'guest' && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-700/60 font-mono">
                Guest
              </span>
            )}
            {author.isBot && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                APP
              </span>
            )}

            {/* Timestamp */}
            <span className="text-xs text-slate-500 font-mono">
              {formatMessageTime(message.createdAt)}
            </span>

            {/* Edited status */}
            {message.isEdited && (
              <span className="text-[11px] text-slate-500 italic">
                (edited)
              </span>
            )}

            {/* Pinned status */}
            {message.pinned && (
              <span className="flex items-center gap-1 text-[11px] text-indigo-400">
                <Pin className="w-3 h-3" /> Pinned
              </span>
            )}
          </div>

          {/* Inline Edit or Standard Message Text */}
          {isEditing ? (
            <div className="mt-1 space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={3}
                className="w-full p-2.5 text-sm bg-slate-900 border border-indigo-500 rounded-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                autoFocus
              />
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-md transition-colors"
                >
                  Save changes
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(message.content);
                  }}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <span className="text-[11px] text-slate-500 ml-auto">
                  Escape to cancel · Enter to save
                </span>
              </div>
            </div>
          ) : (
            <div
              className={`text-sm leading-relaxed text-slate-300 ${
                message.isDeleted ? 'italic text-slate-500' : ''
              }`}
            >
              {renderContent(message.content)}
            </div>
          )}

          {/* File Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {message.attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-200 hover:border-slate-700 transition-colors"
                >
                  <FileCode className="w-5 h-5 text-indigo-400 shrink-0" />
                  <div className="overflow-hidden">
                    <div className="font-semibold truncate max-w-xs">{att.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{att.size}</div>
                  </div>
                  <button
                    onClick={() => {
                      useCollabStore.getState().recordUserActivity();
                    }}
                    title="Download file"
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors ml-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Emoji Reactions Bar */}
          {message.reactions.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {message.reactions.map((r) => {
                const userReacted = r.users.includes(currentUser.id);
                // Get names of reactors
                const reactorNames = r.users
                  .map((uid) => users.find((u) => u.id === uid)?.name || 'User')
                  .join(', ');

                return (
                  <button
                    key={r.emoji}
                    onClick={() => toggleReaction(message.id, r.emoji)}
                    title={`Reacted by: ${reactorNames}`}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs transition-colors ${
                      userReacted
                        ? 'bg-indigo-950/80 border border-indigo-500/80 text-indigo-200'
                        : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <span>{r.emoji}</span>
                    <span className="font-mono text-[11px] font-semibold">{r.count}</span>
                  </button>
                );
              })}

              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors text-xs"
                title="Add reaction"
              >
                +
              </button>
            </div>
          )}

          {/* Inline Emoji Picker Popover */}
          {showEmojiPicker && (
            <div className="mt-2 p-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl flex items-center gap-1.5 w-fit z-10">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    toggleReaction(message.id, emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="w-7 h-7 flex items-center justify-center hover:bg-slate-800 rounded transition-transform hover:scale-125 text-base"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Thread Replies Banner */}
          {message.replyCount > 0 && (
            <button
              onClick={() => openThread(message.id)}
              className="mt-2 flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors group/thread"
            >
              <div className="flex -space-x-1.5 overflow-hidden">
                {message.threadParticipantIds?.slice(0, 3).map((uid) => {
                  const participant = users.find((u) => u.id === uid);
                  return (
                    <UserAvatar
                      key={uid}
                      user={participant}
                      size="xs"
                      showPresence={false}
                      className="ring-2 ring-slate-900"
                    />
                  );
                })}
              </div>
              <span className="group-hover/thread:underline">
                {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {message.lastReplyAt && `Last reply ${formatMessageTime(message.lastReplyAt)}`}
              </span>
            </button>
          )}
        </div>

        {/* Hover Action Floating Pill */}
        {!message.isDeleted && (
          <div className="absolute right-4 top-2 hidden group-hover:flex items-center gap-0.5 bg-slate-900 border border-slate-700/80 rounded-lg shadow-lg p-0.5 z-10">
            {/* Quick Reacts */}
            <button
              onClick={() => toggleReaction(message.id, '👍')}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors text-xs"
              title="React with 👍"
            >
              👍
            </button>
            <button
              onClick={() => toggleReaction(message.id, '❤️')}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors text-xs"
              title="React with ❤️"
            >
              ❤️
            </button>
            <button
              onClick={() => toggleReaction(message.id, '🚀')}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors text-xs"
              title="React with 🚀"
            >
              🚀
            </button>

            {/* Custom Emoji Button */}
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
              title="More reactions"
            >
              <Smile className="w-4 h-4" />
            </button>

            {/* Reply in Thread */}
            <button
              onClick={() => openThread(message.id)}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
              title="Reply in thread"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            {/* Edit Message */}
            {canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                title="Edit message"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}

            {/* Delete Message (RBAC: Owner & Admin can delete any, Member can delete own) */}
            {canDelete && (
              <button
                onClick={() => deleteMessage(message.id)}
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                title="Delete message"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
