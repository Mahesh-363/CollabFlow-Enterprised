import React, { useState } from 'react';
import {
  HelpCircle,
  X,
  Keyboard,
  BookOpen,
  LifeBuoy,
  ShieldCheck,
  Check,
  ExternalLink,
  Search,
  Sparkles,
} from 'lucide-react';
import { useCollabStore } from '../../store/useCollabStore';

export const HelpSupportModal: React.FC = () => {
  const {
    isHelpModalOpen,
    setHelpModalOpen,
    enterpriseTrial,
    currentUser,
    backendConnected,
    backendLatencyMs,
    isCheckingBackend,
    checkBackendHealth,
  } = useCollabStore();
  const [activeTab, setActiveTab] = useState<'shortcuts' | 'guide' | 'support'>('shortcuts');
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [ticketMessage, setTicketMessage] = useState('');

  if (!isHelpModalOpen) return null;

  const shortcuts = [
    { key: '⌘ + K', desc: 'Global Command Palette & Search' },
    { key: '⌘ + N', desc: 'Quick-create Task, Event, or Reminder' },
    { key: '⌘ + /', desc: 'Open Help & Support Center' },
    { key: 'Esc', desc: 'Dismiss active dialog or drawer' },
    { key: 'Enter', desc: 'Send chat message in channel' },
    { key: 'Shift + Enter', desc: 'Insert multiline break in message' },
  ];

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketMessage.trim()) return;
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setTicketMessage('');
      setHelpModalOpen(false);
    }, 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col text-xs text-slate-100">
        {/* Header */}
        <div className="h-14 px-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-950/70 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 id="help-modal-title" className="text-sm font-bold text-white flex items-center gap-2">
                <span>CollabFlow Help & Support</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800">
                  v3.4.0
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Documentation, keyboard shortcuts, and enterprise assistance
              </p>
            </div>
          </div>

          <button
            onClick={() => setHelpModalOpen(false)}
            aria-label="Close Help Modal"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="h-11 px-4 border-b border-slate-800 bg-slate-950/30 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'shortcuts' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Shortcuts</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'guide' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Product Guide</span>
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'support' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Enterprise Support</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 max-h-[420px] overflow-y-auto space-y-4">
          {activeTab === 'shortcuts' && (
            <div className="space-y-3">
              <p className="text-slate-400 text-[11px]">
                Boost your daily velocity with CollabFlow keyboard commands.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {shortcuts.map((sc, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between"
                  >
                    <span className="text-slate-300 font-medium">{sc.desc}</span>
                    <kbd className="px-2 py-0.5 rounded bg-slate-800 text-purple-300 border border-purple-500/30 font-mono text-[10px] font-bold">
                      {sc.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <span>Workspace Architecture</span>
                </h3>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  CollabFlow provides a unified hub for team communication, real-time channels, HD WebRTC meetings, integrated calendars, Kanban task boards, smart reminders, and document sharing.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Zero-Install WebRTC Video Calls</span>
                </h3>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Start instant calls or join scheduled meetings with crystal-clear 1080p video, real-time audio waveforms, in-meeting chat, hand raising, and screen sharing.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  <span>Daily Brief & AI Assistant</span>
                </h3>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Get an automated summary of upcoming meetings, overdue deadlines, and channel action items directly in My Day.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'support' && (
            <form onSubmit={handleSupportSubmit} className="space-y-3.5">
              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/40 text-[11px] text-purple-300 flex items-center justify-between">
                <div>
                  <span className="font-bold">Active SLA Tier: </span>
                  <span>{enterpriseTrial.tier} (24/7 Priority Assistance)</span>
                </div>
                <ShieldCheck className="w-4 h-4 text-purple-400" />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  How can our engineering team assist you?
                </label>
                <textarea
                  rows={3}
                  required
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  placeholder="Describe your question, feature request, or technical report..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-hidden focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-500">
                  Submitting as {currentUser.email}
                </span>

                <button
                  type="submit"
                  disabled={contactSubmitted}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-md shadow-purple-600/30 flex items-center gap-1.5"
                >
                  {contactSubmitted ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Ticket Submitted!</span>
                    </>
                  ) : (
                    <span>Submit Priority Request</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Backend Connectivity Status Indicator */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                backendConnected ? 'bg-emerald-400 animate-pulse' : 'bg-purple-400'
              }`}
            />
            <span className="text-slate-400">Backend Gateway:</span>
            <span className="font-mono text-white font-semibold">
              {backendConnected
                ? `Django 5 Live (${backendLatencyMs ?? 0}ms)`
                : 'Local In-Memory Mode (Vite Preview)'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => checkBackendHealth()}
            disabled={isCheckingBackend}
            className="text-[10px] px-2.5 py-1 rounded-lg bg-purple-950/70 hover:bg-purple-900 border border-purple-800 text-purple-300 transition-colors cursor-pointer font-medium"
          >
            {isCheckingBackend ? 'Pinging API...' : 'Test Connection'}
          </button>
        </div>
      </div>
    </div>
  );
};
