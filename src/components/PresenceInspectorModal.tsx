import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Activity,
  RefreshCw,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  Terminal,
  Radio,
  Smile,
  Shield,
  Zap,
} from 'lucide-react';
import { useCollabStore } from '../store/useCollabStore';
import { UserAvatar } from './UserAvatar';
import { formatRedisPresenceKey, formatRedisConnectionSetKey } from '../utils/collabLogic';

interface WsEventLog {
  id: string;
  time: string;
  direction: 'in' | 'out';
  channel: string;
  payload: Record<string, unknown>;
}

export const PresenceInspectorModal: React.FC = () => {
  const {
    isPresenceInspectorOpen,
    setPresenceInspectorOpen,
    users,
    currentUser,
    redisPresenceMap,
    updateUserPresence,
    lastActivityTimestamp,
    recordUserActivity,
    messages,
    toggleReaction,
  } = useCollabStore();

  const [simulatedMultiTabCount, setSimulatedMultiTabCount] = useState(2);
  const [activeTab, setActiveTab] = useState<'live' | 'code'>('live');
  const [secondsRemaining, setSecondsRemaining] = useState(45);
  const [eventLogs, setEventLogs] = useState<WsEventLog[]>([
    {
      id: 'log-1',
      time: new Date().toLocaleTimeString(),
      direction: 'in',
      channel: `presence_workspace_ws-acme`,
      payload: {
        type: 'presence_broadcast',
        user_id: currentUser.id,
        status: currentUser.presence,
        socket_count: 2,
      },
    },
    {
      id: 'log-2',
      time: new Date().toLocaleTimeString(),
      direction: 'out',
      channel: `presence:connections:${currentUser.id}`,
      payload: {
        action: 'heartbeat_ping',
        redis_key: `presence:user:${currentUser.id}`,
        ttl_seconds: 60,
      },
    },
  ]);

  // Live timer for 45s inactivity countdown
  useEffect(() => {
    if (!isPresenceInspectorOpen) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastActivityTimestamp) / 1000);
      const remaining = Math.max(0, 45 - elapsed);
      setSecondsRemaining(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPresenceInspectorOpen, lastActivityTimestamp]);

  if (!isPresenceInspectorOpen) return null;

  const addLog = (direction: 'in' | 'out', channel: string, payload: Record<string, unknown>) => {
    const newLog: WsEventLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      time: new Date().toLocaleTimeString(),
      direction,
      channel,
      payload,
    };
    setEventLogs((prev) => [newLog, ...prev.slice(0, 9)]);
  };

  const handleSimulateIdle = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateUserPresence('away');
    addLog('in', `presence_workspace_ws-acme`, {
      type: 'presence_broadcast',
      user_id: currentUser.id,
      status: 'away',
      reason: 'inactivity_timer_expired_45s',
    });
  };

  const handleSimulateWakeup = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateUserPresence('online');
    recordUserActivity();
    addLog('in', `presence_workspace_ws-acme`, {
      type: 'presence_broadcast',
      user_id: currentUser.id,
      status: 'online',
      reason: 'user_activity_detected',
    });
  };

  const handleSimulateColleagueReaction = () => {
    const alex = users[1]; // Alex Chen
    const latestMsg = messages[messages.length - 1];
    if (latestMsg && alex) {
      toggleReaction(latestMsg.id, '🔥');
      addLog('in', `chat_${latestMsg.channelId}`, {
        type: 'reaction_broadcast',
        action: 'toggle_reaction',
        message_id: latestMsg.id,
        user_id: alex.id,
        user_name: alex.name,
        emoji: '🔥',
        timestamp: new Date().toISOString(),
      });
    }
  };

  const handleSimulateColleaguePresence = () => {
    const alex = users[1];
    if (alex) {
      const newStatus = alex.presence === 'online' ? 'away' : 'online';
      addLog('in', `presence_workspace_ws-acme`, {
        type: 'presence_broadcast',
        user_id: alex.id,
        user_name: alex.name,
        status: newStatus,
        socket_count: 1,
      });
    }
  };

  const handleAddTab = () => {
    const newCount = simulatedMultiTabCount + 1;
    setSimulatedMultiTabCount(newCount);
    updateUserPresence('online');
    addLog('out', `presence:connections:${currentUser.id}`, {
      command: 'SADD',
      key: formatRedisConnectionSetKey(currentUser.id),
      member: `ws-sock-${currentUser.id.slice(-4)}-${newCount}`,
      total_active_sockets: newCount,
    });
  };

  const handleRemoveTab = () => {
    if (simulatedMultiTabCount > 1) {
      const newCount = simulatedMultiTabCount - 1;
      setSimulatedMultiTabCount(newCount);
      addLog('out', `presence:connections:${currentUser.id}`, {
        command: 'SREM',
        key: formatRedisConnectionSetKey(currentUser.id),
        member: `ws-sock-${currentUser.id.slice(-4)}-${simulatedMultiTabCount}`,
        remaining_sockets: newCount,
      });
    } else {
      setSimulatedMultiTabCount(0);
      updateUserPresence('offline');
      addLog('in', `presence_workspace_ws-acme`, {
        type: 'presence_broadcast',
        user_id: currentUser.id,
        status: 'offline',
        remaining_sockets: 0,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-100">
                  Redis User Presence & Heartbeat Engine
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-mono font-semibold">
                  Redis 7.2 Cluster
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/60 font-mono">
                  Django Channels ASGI
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Key-value presence hashes, multi-socket connection tracking, and WebSocket broadcast events
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 text-xs">
              <button
                onClick={() => setActiveTab('live')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  activeTab === 'live'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Live Monitor & Simulator
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  activeTab === 'code'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Architecture & Code
              </button>
            </div>
            <button
              onClick={() => setPresenceInspectorOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {activeTab === 'live' ? (
          <div className="p-5 overflow-y-auto space-y-5">
            {/* Top Grid: Redis Key State & Inactivity Timer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Active User Redis Key Card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                    Redis Hash: HGETALL
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    TTL: 60s Heartbeat
                  </span>
                </div>

                <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 font-mono text-xs text-slate-200 space-y-1.5">
                  <div className="text-indigo-400 font-semibold">
                    KEY &gt; {formatRedisPresenceKey(currentUser.id)}
                  </div>
                  <div className="text-slate-300 pl-3 border-l-2 border-indigo-500/40 text-[11px] space-y-0.5">
                    <div>status: <span className={`font-bold uppercase ${
                      currentUser.presence === 'online' ? 'text-emerald-400' : currentUser.presence === 'away' ? 'text-amber-400' : 'text-slate-400'
                    }`}>{currentUser.presence}</span></div>
                    <div>last_seen: <span className="text-indigo-300">{Math.floor(lastActivityTimestamp / 1000)}</span> (UNIX)</div>
                    <div>active_sockets: <span className="text-emerald-400 font-bold">{simulatedMultiTabCount}</span></div>
                    <div>custom_status: <span className="text-slate-400">&quot;{currentUser.customStatus || 'None'}&quot;</span></div>
                  </div>
                  <div className="text-indigo-400 font-semibold pt-1">
                    SET &gt; {formatRedisConnectionSetKey(currentUser.id)}
                  </div>
                  <div className="text-slate-400 pl-3 border-l-2 border-emerald-500/40 text-[11px]">
                    [ {simulatedMultiTabCount > 0 ? Array.from({ length: simulatedMultiTabCount }).map((_, i) => `"ws-sock-${currentUser.id.slice(-4)}-${i + 1}"`).join(', ') : 'EMPTY'} ]
                  </div>
                </div>
              </div>

              {/* Inactivity Decay & Heartbeat Monitor */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      Inactivity Decay Window
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {secondsRemaining}s to &apos;Away&apos;
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700/60 mb-2">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        secondsRemaining > 20
                          ? 'bg-emerald-500'
                          : secondsRemaining > 10
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${(secondsRemaining / 45) * 100}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    User activity (mouse moves, keyboard keystrokes, window focus) triggers WebSocket <code className="text-indigo-300 bg-slate-900 px-1 py-0.5 rounded">user_activity</code> frames and refreshes Redis TTL. 45s of total inactivity transitions user to <span className="text-amber-400 font-medium">away</span>.
                  </p>
                </div>

                {/* Quick Simulation Buttons */}
                <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleSimulateIdle}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/80 hover:bg-amber-900/60 transition-colors flex items-center gap-1.5"
                  >
                    <Clock className="w-3 h-3" />
                    <span>Trigger Idle (&gt;45s)</span>
                  </button>

                  <button
                    onClick={handleSimulateWakeup}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/80 hover:bg-emerald-900/60 transition-colors flex items-center gap-1.5"
                  >
                    <Activity className="w-3 h-3" />
                    <span>Trigger Heartbeat</span>
                  </button>

                  <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-400">
                    <span>Tabs:</span>
                    <button
                      onClick={handleAddTab}
                      className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 hover:bg-slate-700 font-mono font-semibold"
                      title="Add WebSocket socket connection"
                    >
                      + Tab
                    </button>
                    <button
                      onClick={handleRemoveTab}
                      className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 hover:bg-slate-700 font-mono font-semibold"
                      title="Disconnect WebSocket socket connection"
                    >
                      - Tab
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Live WebSocket Event Stream Log */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  Live WebSocket Event Stream (Django Channels Redis Layer)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSimulateColleagueReaction}
                    className="px-2 py-1 rounded bg-indigo-950/70 border border-indigo-700/60 text-indigo-300 hover:bg-indigo-900 text-[11px] font-medium flex items-center gap-1 transition-colors"
                  >
                    <Smile className="w-3 h-3" />
                    Simulate Reaction Broadcast
                  </button>
                  <button
                    onClick={handleSimulateColleaguePresence}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors"
                  >
                    Simulate Colleague Update
                  </button>
                </div>
              </div>

              <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-800 font-mono text-xs max-h-40 overflow-y-auto space-y-2">
                {eventLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 text-[11px]">
                    <span className="text-slate-500 shrink-0">{log.time}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase shrink-0 ${
                        log.direction === 'in'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                      }`}
                    >
                      {log.direction === 'in' ? 'WS RECV' : 'WS SEND'}
                    </span>
                    <span className="text-slate-400 truncate max-w-xs">{log.channel}</span>
                    <span className="text-slate-200 truncate flex-1">
                      {JSON.stringify(log.payload)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* All Workspace Members Redis Presence Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Active Workspace Presence Registry (Redis Cluster)
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {users.length} connected user entities
                </span>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3">User</th>
                      <th className="p-3">Redis Key</th>
                      <th className="p-3">Presence State</th>
                      <th className="p-3 text-right">Active Sockets</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-950/40">
                    {users.map((user) => {
                      const record = redisPresenceMap[user.id] || {
                        status: user.presence,
                        lastSeen: Date.now(),
                        socketCount: user.presence === 'offline' ? 0 : 1,
                      };

                      const statusStyles: Record<string, { bg: string; text: string; dot: string }> = {
                        online: { bg: 'bg-emerald-950/60', text: 'text-emerald-300', dot: 'bg-emerald-400' },
                        away: { bg: 'bg-amber-950/60', text: 'text-amber-300', dot: 'bg-amber-400' },
                        dnd: { bg: 'bg-rose-950/60', text: 'text-rose-300', dot: 'bg-rose-400' },
                        offline: { bg: 'bg-slate-900', text: 'text-slate-400', dot: 'bg-slate-500' },
                      };

                      const currentStyle = statusStyles[user.presence] || statusStyles.offline;

                      return (
                        <tr key={user.id} className="hover:bg-slate-900/50 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <UserAvatar user={user} size="xs" />
                              <span className="font-semibold text-slate-200">{user.name}</span>
                              {user.id === currentUser.id && (
                                <span className="text-[10px] text-indigo-400 font-mono">(You)</span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-slate-400">
                            {formatRedisPresenceKey(user.id)}
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border border-slate-700/60 ${currentStyle.bg} ${currentStyle.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${currentStyle.dot}`} />
                              <span className="capitalize">{user.presence}</span>
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono text-slate-300">
                            {user.id === currentUser.id ? simulatedMultiTabCount : record.socketCount}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* Code & Architecture Tab */
          <div className="p-5 overflow-y-auto space-y-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                Redis Key Schema & Data Model
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                CollabFlow presence utilizes high-performance Redis Hashes and Sets designed for sub-10ms response times and horizontal multi-process Daphne clustering:
              </p>
              <div className="bg-slate-900 p-3 rounded-lg font-mono text-xs text-slate-300 space-y-1">
                <div><span className="text-emerald-400">presence:user:&lt;user_id&gt;</span> (Hash) -&gt; &#123; status: &quot;online&quot;|&quot;away&quot;|&quot;offline&quot;, last_seen: &lt;unix_ts&gt; &#125;</div>
                <div><span className="text-indigo-400">presence:connections:&lt;user_id&gt;</span> (Set) -&gt; [ &quot;ws-sock-1&quot;, &quot;ws-sock-2&quot; ] (Multi-Tab Connection Pool)</div>
                <div><span className="text-amber-400">channel_layer:group:presence_workspace_&lt;id&gt;</span> -&gt; WebSocket broadcast multicast group</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Smile className="w-4 h-4 text-amber-400" />
                Emoji Reaction Model & Serializer Flow
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Reactions are persisted via Django ORM with composite unique constraints and aggregated on read:
              </p>
              <pre className="bg-slate-900 p-3 rounded-lg font-mono text-xs text-slate-300 overflow-x-auto">
{`class MessageReaction(models.Model):
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='reactions')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    emoji = models.CharField(max_length=16)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('message', 'user', 'emoji')`}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
