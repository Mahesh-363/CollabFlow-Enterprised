import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Calendar,
  CheckSquare,
  Video,
  FileText,
  RefreshCw,
  Lightbulb,
} from 'lucide-react';
import { useCollabStore } from '../../store/useCollabStore';
import { generateDailyBrief } from '../../utils/collabSuiteLogic';

interface AIChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export const AIAssistantView: React.FC = () => {
  const {
    currentUser,
    tasks,
    meetings,
    calendarEvents,
    channels,
    workspaceFiles,
  } = useCollabStore();

  const [inputPrompt, setInputPrompt] = useState('');
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'ai-init',
      sender: 'ai',
      text: `Hello ${currentUser.name.split(' ')[0]}! I am your CollabFlow Workspace Copilot. I have analyzed your 5 calendar events, 3 meetings, 6 active sprint tasks, and recent channel threads. How can I help you today?`,
      timestamp: 'Just now',
    },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Daily brief generator
  const dailyBrief = generateDailyBrief({
    userName: currentUser.name.split(' ')[0],
    meetingsTodayCount: calendarEvents.filter((e) => e.startDate === '2026-10-16').length,
    tasksPendingCount: tasks.filter((t) => t.assigneeId === currentUser.id && t.status !== 'done').length,
    overdueTasksCount: tasks.filter((t) => t.assigneeId === currentUser.id && t.status !== 'done' && t.dueDate < '2026-10-16').length,
    unreadMessagesCount: 5,
  });

  const promptChips = [
    "Summarize today's meetings and agenda",
    "What tasks are overdue or due soon?",
    "Extract action items from #engineering",
    "Who is working on the WebRTC failover?",
  ];

  const handleSendPrompt = (promptText: string) => {
    if (!promptText.trim()) return;

    const userMsg: AIChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsGenerating(true);

    setTimeout(() => {
      let aiResponseText = '';
      const lower = promptText.toLowerCase();

      if (lower.includes('meeting') || lower.includes('agenda') || lower.includes('schedule')) {
        const meets = meetings.map((m) => `• ${m.title} (${m.durationMinutes}m) at ${new Date(m.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`).join('\n');
        aiResponseText = `Here is your schedule for today:\n${meets}\n\nKey recommendation: Ensure you have your microphone ready for the 10:00 AM architecture scale review.`;
      } else if (lower.includes('task') || lower.includes('overdue')) {
        const pending = tasks.filter((t) => t.status !== 'done');
        aiResponseText = `You currently have ${pending.length} open tasks in the sprint:\n` +
          pending.map((t) => `• [${t.priority.toUpperCase()}] ${t.title} (Due: ${t.dueDate})`).join('\n') +
          `\n\nUrgent action: "Run SOC-2 Access Control & JWT Rotation Audit" is due today!`;
      } else if (lower.includes('engineering') || lower.includes('action')) {
        aiResponseText = `Action items extracted from recent #engineering and meeting notes:\n` +
          `1. Alex Chen to benchmark Mediasoup vs Pion SFU under 500 concurrent video feeds.\n` +
          `2. Elena Vance to finalize Redis cluster memory ceiling alerts.\n` +
          `3. David Kim to monitor RDS replica replication lag under 20k RPS.`;
      } else if (lower.includes('webrtc')) {
        aiResponseText = `Elena Vance (You) and Alex Chen are actively working on WebRTC! Task "Finalize WebRTC STUN/TURN Signaling Failover" has 2 of 3 subtasks completed.`;
      } else {
        aiResponseText = `Based on your CollabFlow workspace:\n` +
          `• Workspace: Acme Corp Platform (128 members)\n` +
          `• Channels: #general, #engineering, #releases, #security\n` +
          `• System status: All 42 microservices and Redis cluster nominal.\n` +
          `Would you like me to draft an announcement, schedule a sync, or summarize a thread?`;
      }

      const aiMsg: AIChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsGenerating(false);
    }, 600);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* HEADER */}
      <div className="h-14 px-6 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              <span>CollabFlow AI Assistant</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                Workspace Copilot
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              Grounded in your channels, meetings, tasks, and files
            </p>
          </div>
        </div>
      </div>

      {/* CHAT MESSAGES SCROLLER */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-4xl w-full mx-auto">
        {/* DAILY BRIEF CARD */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Today's Executive Summary</span>
            </span>
            <span className="text-[10px] text-slate-400">October 16, 2026</span>
          </div>
          <p className="text-xs text-slate-200">{dailyBrief.summary}</p>
          <div className="text-[11px] text-indigo-300 font-medium">
            💡 Focus: {dailyBrief.focusTip}
          </div>
        </div>

        {/* MESSAGE BUBBLES */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.sender === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-xs font-bold'
                  : 'bg-indigo-950 border border-indigo-700/60 text-indigo-400'
              }`}
            >
              {msg.sender === 'user' ? currentUser.avatar : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`p-4 rounded-2xl max-w-2xl text-xs space-y-1.5 leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] opacity-75">
                <span className="font-bold">
                  {msg.sender === 'user' ? currentUser.name : 'CollabFlow AI'}
                </span>
                <span>{msg.timestamp}</span>
              </div>
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}

        {isGenerating && (
          <div className="flex items-center gap-2 text-xs text-indigo-400 p-2">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>Analyzing workspace telemetry & compiling response...</span>
          </div>
        )}
      </div>

      {/* FOOTER & INPUT */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/60 max-w-4xl w-full mx-auto space-y-2.5">
        {/* Prompt Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {promptChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendPrompt(chip)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-950/40 text-[11px] text-slate-300 hover:text-white transition-all shrink-0 flex items-center gap-1.5"
            >
              <Lightbulb className="w-3 h-3 text-amber-400" />
              <span>{chip}</span>
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendPrompt(inputPrompt);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Ask AI anything about tasks, meetings, channels, or team status..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || isGenerating}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
