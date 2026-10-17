import React, { useState, useRef } from 'react';
import {
  Bold,
  Italic,
  Code,
  List,
  Paperclip,
  Smile,
  Send,
  FileCode,
  X,
} from 'lucide-react';
import { useCollabStore } from '../store/useCollabStore';
import { FileAttachment } from '../types/collab';

interface MessageInputProps {
  channelId: string;
  placeholder?: string;
}

const EMOJI_PALETTE = ['👍', '❤️', '🔥', '🚀', '👀', '🎉', '💯', '👏', '⚡', '✨', '🧠', '🛡️'];

export const MessageInput: React.FC<MessageInputProps> = ({
  channelId,
  placeholder = 'Send a message...',
}) => {
  const { sendMessage, currentUser, setTyping } = useCollabStore();
  const [content, setContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    // Broadcast typing indicator
    if (val.trim()) {
      setTyping(channelId, currentUser.name, true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(channelId, currentUser.name, false);
      }, 2000);
    } else {
      setTyping(channelId, currentUser.name, false);
    }
  };

  const handleSend = () => {
    if (!content.trim() && attachments.length === 0) return;

    sendMessage(channelId, content.trim(), attachments);
    setContent('');
    setAttachments([]);
    setShowEmojiPicker(false);
    setShowAttachmentMenu(false);
    setTyping(channelId, currentUser.name, false);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const wrapSelection = (prefix: string, suffix: string = prefix) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const replacement = `${prefix}${selectedText || 'text'}${suffix}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const attachSampleFile = (type: 'sql' | 'yaml' | 'json') => {
    const sampleFiles: Record<string, FileAttachment> = {
      sql: {
        id: `att-${Date.now()}`,
        name: '0043_add_gin_trgm_index.sql',
        size: '3.4 KB',
        type: 'code',
        url: '#',
      },
      yaml: {
        id: `att-${Date.now()}`,
        name: 'daphne-asgi-service.yaml',
        size: '1.8 KB',
        type: 'code',
        url: '#',
      },
      json: {
        id: `att-${Date.now()}`,
        name: 'redis_cluster_nodes.json',
        size: '12.6 KB',
        type: 'code',
        url: '#',
      },
    };

    setAttachments([...attachments, sampleFiles[type]]);
    setShowAttachmentMenu(false);
  };

  return (
    <div className="p-4 bg-slate-900/60 border-t border-slate-800/80 shrink-0">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl overflow-hidden focus-within:border-indigo-500/80 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all shadow-md">
        {/* Attachment Previews */}
        {attachments.length > 0 && (
          <div className="p-2 border-b border-slate-800 flex flex-wrap gap-2 bg-slate-950/40">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-2 px-2.5 py-1 rounded bg-slate-800 text-xs text-slate-200 border border-slate-700"
              >
                <FileCode className="w-4 h-4 text-indigo-400" />
                <span className="font-mono text-[11px] truncate max-w-[180px]">{att.name}</span>
                <button
                  onClick={() => setAttachments(attachments.filter((a) => a.id !== att.id))}
                  className="text-slate-400 hover:text-rose-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={2}
          className="w-full px-3 py-2.5 text-sm bg-transparent text-slate-100 placeholder-slate-500 resize-none focus:outline-none leading-relaxed"
        />

        {/* Formatting & Action Bar */}
        <div className="px-3 py-2 bg-slate-950/60 border-t border-slate-800/60 flex items-center justify-between">
          {/* Left formatting buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => wrapSelection('**')}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
              title="Bold (**text**)"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => wrapSelection('*')}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
              title="Italic (*text*)"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              onClick={() => wrapSelection('`')}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
              title="Inline Code (`code`)"
            >
              <Code className="w-4 h-4" />
            </button>
            <button
              onClick={() => wrapSelection('- ')}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
              title="Bullet list (- )"
            >
              <List className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-4 bg-slate-800 mx-1" />

            {/* Attachment Button */}
            <div className="relative">
              <button
                onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                title="Attach code snippet or file"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {showAttachmentMenu && (
                <div className="absolute left-0 bottom-full mb-2 w-48 p-1.5 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-20 space-y-1">
                  <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Add Sample Attachment
                  </div>
                  <button
                    onClick={() => attachSampleFile('sql')}
                    className="w-full text-left px-2 py-1.5 text-xs text-slate-200 hover:bg-slate-800 rounded flex items-center gap-2"
                  >
                    <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                    <span>SQL Migration script</span>
                  </button>
                  <button
                    onClick={() => attachSampleFile('yaml')}
                    className="w-full text-left px-2 py-1.5 text-xs text-slate-200 hover:bg-slate-800 rounded flex items-center gap-2"
                  >
                    <FileCode className="w-3.5 h-3.5 text-blue-400" />
                    <span>Kubernetes YAML spec</span>
                  </button>
                  <button
                    onClick={() => attachSampleFile('json')}
                    className="w-full text-left px-2 py-1.5 text-xs text-slate-200 hover:bg-slate-800 rounded flex items-center gap-2"
                  >
                    <FileCode className="w-3.5 h-3.5 text-amber-400" />
                    <span>Redis Cluster JSON</span>
                  </button>
                </div>
              )}
            </div>

            {/* Emoji Button */}
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                title="Add emoji"
              >
                <Smile className="w-4 h-4" />
              </button>

              {showEmojiPicker && (
                <div className="absolute left-0 bottom-full mb-2 p-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl grid grid-cols-4 gap-1.5 z-20">
                  {EMOJI_PALETTE.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        setContent((prev) => prev + emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="w-8 h-8 flex items-center justify-center hover:bg-slate-800 rounded text-lg transition-transform hover:scale-125"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right send button */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-mono hidden md:inline">
              Return to send
            </span>
            <button
              onClick={handleSend}
              disabled={!content.trim() && attachments.length === 0}
              className={`p-1.5 rounded-lg font-medium transition-colors ${
                content.trim() || attachments.length > 0
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
              title="Send message (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
