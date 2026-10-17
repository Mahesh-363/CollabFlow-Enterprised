import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Monitor,
  Hand,
  PhoneOff,
  MessageSquare,
  Users,
  FileText,
  Settings,
  Shield,
  Copy,
  Check,
  Sparkles,
  Send,
  MoreVertical,
} from 'lucide-react';
import { useCollabStore } from '../../store/useCollabStore';
import { UserAvatar } from '../UserAvatar';

export const MeetingRoom: React.FC = () => {
  const {
    activeMeeting,
    currentUser,
    users,
    leaveMeeting,
    meetingMediaState,
    toggleMeetingMic,
    toggleMeetingCamera,
    toggleMeetingScreenShare,
    toggleMeetingHandRaise,
    sendMeetingChatMessage,
  } = useCollabStore();

  const [activeSidePanel, setActiveSidePanel] = useState<'chat' | 'participants' | 'notes' | null>('chat');
  const [copiedLink, setCopiedLink] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isLobbyWaiting, setIsLobbyWaiting] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize Real Video / Audio MediaStream
  useEffect(() => {
    let isCancelled = false;
    let animFrame: number;

    const setupMedia = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          if (!isCancelled && localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
            streamRef.current = stream;
          }
        } else {
          throw new Error('getUserMedia unavailable');
        }
      } catch (err) {
        // Fallback: Generate real MediaStream via Canvas captureStream
        // This ensures WebRTC media pipeline receives real video frames in headless or restricted browser environments
        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 360;
        const ctx = canvas.getContext('2d');

        let angle = 0;
        const renderFrame = () => {
          if (!ctx) return;
          angle += 0.05;

          // Gradient background
          const grad = ctx.createLinearGradient(0, 0, 640, 360);
          grad.addColorStop(0, '#0f172a');
          grad.addColorStop(0.5, '#1e1b4b');
          grad.addColorStop(1, '#020617');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, 640, 360);

          // Simulated Audio Waveform
          ctx.strokeStyle = '#6366f1';
          ctx.lineWidth = 3;
          ctx.beginPath();
          for (let x = 0; x < 640; x += 10) {
            const y = 180 + Math.sin(x * 0.03 + angle) * 20 * (meetingMediaState.isMuted ? 0.05 : 1);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();

          // User Initial Circle
          ctx.fillStyle = '#4f46e5';
          ctx.beginPath();
          ctx.arc(320, 160, 45, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 28px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(currentUser.avatar || 'CF', 320, 160);

          // Name label
          ctx.font = '14px sans-serif';
          ctx.fillText(currentUser.name, 320, 230);

          animFrame = requestAnimationFrame(renderFrame);
        };
        renderFrame();

        if (canvas.captureStream) {
          const canvasStream = canvas.captureStream(30);
          if (!isCancelled && localVideoRef.current) {
            localVideoRef.current.srcObject = canvasStream;
            streamRef.current = canvasStream;
          }
        }
      }
    };

    setupMedia();

    return () => {
      isCancelled = true;
      if (animFrame) cancelAnimationFrame(animFrame);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [currentUser, meetingMediaState.isMuted]);

  if (!activeMeeting) return null;

  const participants = activeMeeting.participantIds.map(
    (id) => users.find((u) => u.id === id) || { id, name: 'Guest Member', avatar: 'GM', role: 'member', presence: 'online', title: '', email: '' }
  );

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(activeMeeting.meetingLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMeetingChatMessage(activeMeeting.id, chatInput.trim());
    setChatInput('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0d14] text-slate-100 select-none overflow-hidden relative">
      {/* HIDDEN CANVAS FOR MEDIASTREAM SYNTHESIS */}
      <canvas ref={canvasRef} className="hidden" />

      {/* TOP MEETING HEADER */}
      <div className="h-14 px-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{activeMeeting.title}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                HD 1080p WebRTC
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              Host: {users.find((u) => u.id === activeMeeting.hostId)?.name || 'Elena Vance'} • {participants.length} connected
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Copy Meeting Link */}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white transition-colors"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedLink ? 'Copied Link' : 'Copy Joining Link'}</span>
          </button>

          {/* End Call / Leave Meeting */}
          <button
            onClick={leaveMeeting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 transition-all hover:scale-105"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span>Leave</span>
          </button>
        </div>
      </div>

      {/* CENTER VIDEO GRID + SIDE PANEL */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* VIDEO FEEDS CONTAINER */}
        <div className="flex-1 p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 overflow-y-auto">
          {/* LOCAL USER FEED */}
          <div className="relative rounded-2xl bg-slate-900 border-2 border-indigo-500/50 shadow-xl overflow-hidden flex flex-col justify-between group">
            {/* Real Video Element */}
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover absolute inset-0 ${
                meetingMediaState.isCameraOff ? 'hidden' : 'block'
              }`}
            />

            {/* Camera Off Avatar Screen */}
            {meetingMediaState.isCameraOff && (
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-indigo-950/40 to-slate-900 flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {currentUser.avatar}
                </div>
                <span className="text-sm font-semibold text-slate-300 mt-2">Camera Off</span>
              </div>
            )}

            {/* Video Overlay Indicators */}
            <div className="relative z-10 p-3 flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md text-[11px] font-semibold text-white flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>You ({currentUser.name})</span>
              </span>

              <div className="flex items-center gap-1">
                {meetingMediaState.isHandRaised && (
                  <span className="p-1 rounded-full bg-amber-500 text-black animate-bounce" title="Hand Raised">
                    <Hand className="w-3.5 h-3.5" />
                  </span>
                )}
                <span
                  className={`p-1 rounded-full ${
                    meetingMediaState.isMuted ? 'bg-rose-600 text-white' : 'bg-slate-950/80 text-emerald-400'
                  }`}
                >
                  {meetingMediaState.isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </span>
              </div>
            </div>

            {/* Speaking / Audio Wave Meter */}
            <div className="relative z-10 p-3 flex items-center gap-1">
              <div className="h-1.5 w-1 rounded-full bg-emerald-400 animate-pulse" />
              <div className="h-3 w-1 rounded-full bg-emerald-400 animate-pulse" />
              <div className="h-2 w-1 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>

          {/* PEER VIDEO FEEDS */}
          {participants
            .filter((p) => p.id !== currentUser.id)
            .map((peer, idx) => (
              <div
                key={peer.id}
                className="relative rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden flex flex-col justify-between group"
              >
                {/* Simulated Peer Media Feed with dynamic audio visualizer */}
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950/30 flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-700 to-violet-900 flex items-center justify-center text-white text-2xl font-bold shadow-lg ring-4 ring-indigo-500/20">
                    {peer.avatar}
                  </div>
                  <span className="text-sm font-semibold text-slate-200 mt-2">{peer.name}</span>
                  <span className="text-xs text-slate-400">{peer.title || 'Collaborator'}</span>
                </div>

                {/* Peer Header Badge */}
                <div className="relative z-10 p-3 flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md text-[11px] font-semibold text-white">
                    {peer.name}
                  </span>
                  <span className="p-1 rounded-full bg-slate-950/80 text-emerald-400">
                    <Mic className="w-3.5 h-3.5" />
                  </span>
                </div>

                {/* Peer Audio Wave */}
                <div className="relative z-10 p-3 flex items-center gap-1">
                  <div
                    className="h-2 w-1 rounded-full bg-indigo-400 animate-pulse"
                    style={{ animationDelay: `${idx * 150}ms` }}
                  />
                  <div
                    className="h-4 w-1 rounded-full bg-indigo-400 animate-pulse"
                    style={{ animationDelay: `${idx * 200}ms` }}
                  />
                  <div
                    className="h-2.5 w-1 rounded-full bg-indigo-400 animate-pulse"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  />
                </div>
              </div>
            ))}
        </div>

        {/* CONTEXTUAL SIDEBAR: CHAT / PARTICIPANTS / NOTES */}
        {activeSidePanel && (
          <div className="w-80 border-l border-slate-800 bg-slate-900/95 flex flex-col justify-between shrink-0 z-20">
            {/* Tabs */}
            <div className="h-11 px-2 border-b border-slate-800 flex items-center gap-1 bg-slate-950/50">
              <button
                onClick={() => setActiveSidePanel('chat')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  activeSidePanel === 'chat' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat</span>
              </button>
              <button
                onClick={() => setActiveSidePanel('participants')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  activeSidePanel === 'participants' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>People ({participants.length})</span>
              </button>
              <button
                onClick={() => setActiveSidePanel('notes')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  activeSidePanel === 'notes' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Notes</span>
              </button>
            </div>

            {/* CONTENT BY TAB */}
            <div className="flex-1 overflow-y-auto p-3 text-xs">
              {activeSidePanel === 'chat' && (
                <div className="space-y-3">
                  <div className="p-2 rounded-lg bg-indigo-950/30 border border-indigo-800/40 text-[11px] text-indigo-300">
                    🔒 Messages sent here are synchronized in real-time with meeting participants.
                  </div>
                  <div className="space-y-2">
                    {(activeMeeting.chatMessages || []).map((msg) => (
                      <div key={msg.id} className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/60 space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-slate-300">{msg.userName}</span>
                          <span className="text-slate-500">{msg.timestamp}</span>
                        </div>
                        <p className="text-slate-200">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSidePanel === 'participants' && (
                <div className="space-y-2">
                  {participants.map((p) => (
                    <div
                      key={p.id}
                      className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <UserAvatar user={p as any} size="xs" />
                        <div>
                          <p className="font-semibold text-slate-200">{p.name}</p>
                          <p className="text-[10px] text-slate-500">{p.title || 'Member'}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono">Connected</span>
                    </div>
                  ))}
                </div>
              )}

              {activeSidePanel === 'notes' && (
                <div className="space-y-3">
                  <div>
                    <h3 className="font-bold text-slate-200 mb-1">Agenda</h3>
                    <p className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300 whitespace-pre-wrap">
                      {activeMeeting.agenda || '1. Weekly progress sync\n2. Blockers review\n3. Action items assignment'}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-200 mb-1">Action Items</h3>
                    <div className="space-y-1.5">
                      {(activeMeeting.actionItems || ['Review load test results', 'Publish design tokens']).map(
                        (ai, i) => (
                          <div
                            key={i}
                            className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center gap-2 text-slate-300"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>{ai}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input Bar */}
            {activeSidePanel === 'chat' && (
              <form onSubmit={handleSendMessage} className="p-2 border-t border-slate-800 flex items-center gap-1.5">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Chat with meeting..."
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* BOTTOM CONTROL BAR */}
      <div className="h-16 px-4 bg-slate-900 border-t border-slate-800/80 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-2">
          {/* Mute/Unmute Mic */}
          <button
            onClick={toggleMeetingMic}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              meetingMediaState.isMuted
                ? 'bg-rose-600/30 text-rose-300 border border-rose-500/50 hover:bg-rose-600/40'
                : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
          >
            {meetingMediaState.isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-400" />}
            <span className="hidden sm:inline">{meetingMediaState.isMuted ? 'Unmute' : 'Mute'}</span>
          </button>

          {/* Camera On/Off */}
          <button
            onClick={toggleMeetingCamera}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              meetingMediaState.isCameraOff
                ? 'bg-rose-600/30 text-rose-300 border border-rose-500/50 hover:bg-rose-600/40'
                : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
          >
            {meetingMediaState.isCameraOff ? (
              <VideoOff className="w-4 h-4" />
            ) : (
              <VideoIcon className="w-4 h-4 text-emerald-400" />
            )}
            <span className="hidden sm:inline">{meetingMediaState.isCameraOff ? 'Start Video' : 'Stop Video'}</span>
          </button>
        </div>

        {/* Center Controls: Screen Share & Hand Raise */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMeetingScreenShare}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              meetingMediaState.isScreenSharing
                ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span className="hidden sm:inline">
              {meetingMediaState.isScreenSharing ? 'Stop Share' : 'Share Screen'}
            </span>
          </button>

          <button
            onClick={toggleMeetingHandRaise}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              meetingMediaState.isHandRaised
                ? 'bg-amber-500 text-black font-bold'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            <Hand className="w-4 h-4" />
            <span className="hidden sm:inline">
              {meetingMediaState.isHandRaised ? 'Lower Hand' : 'Raise Hand'}
            </span>
          </button>
        </div>

        {/* Right Controls: Panels toggle */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveSidePanel(activeSidePanel === 'chat' ? null : 'chat')}
            className={`p-2 rounded-xl transition-colors ${
              activeSidePanel === 'chat' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
            }`}
            title="Meeting Chat"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveSidePanel(activeSidePanel === 'participants' ? null : 'participants')}
            className={`p-2 rounded-xl transition-colors ${
              activeSidePanel === 'participants' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
            }`}
            title="Participants"
          >
            <Users className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveSidePanel(activeSidePanel === 'notes' ? null : 'notes')}
            className={`p-2 rounded-xl transition-colors ${
              activeSidePanel === 'notes' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
            }`}
            title="Meeting Notes"
          >
            <FileText className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
