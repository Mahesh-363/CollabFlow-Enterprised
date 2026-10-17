import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Users,
  Hash,
  Lock,
  Key,
  Check,
  Building,
  Save,
  Globe,
  Plus,
  Server,
  Activity,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useCollabStore } from '../../store/useCollabStore';
import { UserAvatar } from '../UserAvatar';

export const WorkspaceSettingsView: React.FC = () => {
  const {
    workspaces,
    activeWorkspaceId,
    channels,
    users,
    currentUser,
    setCreateChannelOpen,
    enterpriseTrial,
    backendConnected,
    backendLatencyMs,
    isCheckingBackend,
    backendStatusText,
    checkBackendHealth,
  } = useCollabStore();

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  const [activeTab, setActiveTab] = useState<'general' | 'channels' | 'members' | 'security' | 'backend'>('general');
  const [wsName, setWsName] = useState(activeWorkspace.name);
  const [wsSlug, setWsSlug] = useState(activeWorkspace.slug);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Security policies
  const [enforceSSO, setEnforceSSO] = useState(true);
  const [enforce2FA, setEnforce2FA] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('15');

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-400" />
            <span>Workspace Settings & Administration</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure branding, channels, team permissions, Single Sign-On, and SOC-2 policies
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Real-time backend status pill */}
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-lg border text-xs font-mono font-medium ${
              backendConnected
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                : 'bg-purple-950/40 text-purple-300 border-purple-800/60'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${backendConnected ? 'bg-emerald-400 animate-pulse' : 'bg-purple-400'}`} />
            <span>{backendConnected ? `API Online (${backendLatencyMs ?? 0}ms)` : 'In-Memory Mode'}</span>
          </div>

          <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
            {enterpriseTrial.tier}
          </span>
        </div>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 flex items-center gap-1.5 ${
            activeTab === 'general' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>General Branding</span>
        </button>

        <button
          onClick={() => setActiveTab('channels')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 flex items-center gap-1.5 ${
            activeTab === 'channels' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Hash className="w-3.5 h-3.5" />
          <span>Channels ({channels.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 flex items-center gap-1.5 ${
            activeTab === 'members' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Members & Roles ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 flex items-center gap-1.5 ${
            activeTab === 'security' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Security & SSO Policies</span>
        </button>

        <button
          onClick={() => setActiveTab('backend')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 flex items-center gap-1.5 ${
            activeTab === 'backend' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>Backend & API</span>
        </button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveGeneral} className="max-w-xl space-y-4 text-xs">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Workspace Profile & URL
            </h2>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Workspace Name</label>
              <input
                type="text"
                value={wsName}
                onChange={(e) => setWsName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Workspace URL Slug</label>
              <div className="flex items-center rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
                <span className="px-3 py-2 bg-slate-900 text-slate-500 font-mono text-[11px] border-r border-slate-800">
                  https://collabflow.app/
                </span>
                <input
                  type="text"
                  value={wsSlug}
                  onChange={(e) => setWsSlug(e.target.value)}
                  className="flex-1 px-3 py-2 bg-transparent text-white font-mono text-[11px] focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                Created by Elena Vance (Owner) • 128 licensed seats
              </span>

              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md shadow-indigo-600/30"
              >
                {savedSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
                <span>{savedSuccess ? 'Settings Saved' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {activeTab === 'channels' && (
        <div className="space-y-4 text-xs max-w-3xl">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-200">
              Active Channels in {activeWorkspace.name}
            </span>
            <button
              onClick={() => setCreateChannelOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Channel</span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden divide-y divide-slate-800">
            {channels.map((chan) => (
              <div key={chan.id} className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {chan.isPrivate ? (
                    <Lock className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Hash className="w-4 h-4 text-indigo-400" />
                  )}
                  <div>
                    <h3 className="font-bold text-slate-100">{chan.name}</h3>
                    <p className="text-[11px] text-slate-400">{chan.description || chan.topic}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-500 font-mono">
                    {chan.memberIds.length} members
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="space-y-4 text-xs max-w-3xl">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden divide-y divide-slate-800">
            {users.map((u) => (
              <div key={u.id} className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserAvatar user={u} size="sm" />
                  <div>
                    <h3 className="font-bold text-slate-100">{u.name}</h3>
                    <p className="text-[11px] text-slate-400">{u.title} • {u.email}</p>
                  </div>
                </div>

                <select
                  defaultValue={u.role}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-white font-semibold capitalize"
                >
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="guest">Guest</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="max-w-xl space-y-4 text-xs">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>Authentication & Access Security</span>
            </h2>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                <div>
                  <p className="font-bold text-slate-200">Enforce Corporate SSO</p>
                  <p className="text-[11px] text-slate-400">
                    Require Google Identity, Microsoft Entra ID, or Apple ID
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={enforceSSO}
                  onChange={(e) => setEnforceSSO(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                <div>
                  <p className="font-bold text-slate-200">Enforce Multi-Factor Authentication (2FA)</p>
                  <p className="text-[11px] text-slate-400">
                    Require hardware security keys or authenticator TOTP codes
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={enforce2FA}
                  onChange={(e) => setEnforce2FA(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
                />
              </label>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <label className="block font-bold text-slate-200">JWT Token Lifetime & Inactivity Timeout</label>
                <select
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white"
                >
                  <option value="15">15 Minutes (Strict SOC-2)</option>
                  <option value="60">1 Hour</option>
                  <option value="480">8 Hours (Workday)</option>
                  <option value="1440">24 Hours</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BACKEND & API TAB */}
      {activeTab === 'backend' && (
        <div className="max-w-2xl space-y-4 text-xs">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Server className="w-4 h-4 text-purple-400" />
                  <span>Python Backend & Real-Time Gateway</span>
                </h2>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Django 5, Django REST Framework, Daphne ASGI, and Redis 7.2 Channel Layer
                </p>
              </div>

              <button
                type="button"
                onClick={() => checkBackendHealth()}
                disabled={isCheckingBackend}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingBackend ? 'animate-spin' : ''}`} />
                <span>{isCheckingBackend ? 'Pinging...' : 'Test Connection'}</span>
              </button>
            </div>

            {/* Status Card */}
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                backendConnected
                  ? 'bg-emerald-950/30 border-emerald-800/80 text-emerald-200'
                  : 'bg-purple-950/20 border-purple-800/50 text-slate-300'
              }`}
            >
              <div className="mt-0.5">
                {backendConnected ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Activity className="w-5 h-5 text-purple-400" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-white text-xs">
                    {backendConnected
                      ? `Live Connected (HTTP / ASGI WebSockets)`
                      : `Local In-Memory Mode Active (Vite Preview)`}
                  </p>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                    {backendStatusText}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {backendConnected
                    ? 'All chat channels, direct messages, tasks, calendar events, reminders, and files are synchronized with PostgreSQL 16 (pgvector) and Redis 7.2.'
                    : 'The client-side React UI seamlessly functions with in-memory persistence and optimistic updates. To attach the real Python Django backend, run Docker Compose locally on your machine.'}
                </p>
              </div>
            </div>

            {/* Architecture Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate-500">REST API Gateway</span>
                <p className="font-mono font-semibold text-white text-xs">/api/v1/ (SimpleJWT + DRF)</p>
                <p className="text-[11px] text-slate-400">Versioned endpoints for auth, tasks, calendar, chat, AI</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate-500">WebSocket Layer</span>
                <p className="font-mono font-semibold text-white text-xs">/ws/chat/, /ws/meeting/</p>
                <p className="text-[11px] text-slate-400">Daphne ASGI + Redis channel layer with heartbeat</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate-500">Asynchronous Workers</span>
                <p className="font-mono font-semibold text-white text-xs">Celery 5.4 + Celery Beat</p>
                <p className="text-[11px] text-slate-400">Scheduled reminders, AI briefs, notification fan-out</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate-500">Vector & Text Search</span>
                <p className="font-mono font-semibold text-white text-xs">PostgreSQL 16 + pgvector</p>
                <p className="text-[11px] text-slate-400">GIN full-text indices and 768-dim embeddings</p>
              </div>
            </div>

            {/* Docker Quickstart Box */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <p className="font-semibold text-slate-200 text-xs">Windows PowerShell / Bash Docker Quickstart:</p>
              <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-purple-300 overflow-x-auto">
{`# 1. Start all backend containers (PostgreSQL, Redis, Daphne, Celery)
docker compose up --build -d

# 2. Seed initial enterprise demo accounts and channels
docker compose exec backend python manage.py seed_demo`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
