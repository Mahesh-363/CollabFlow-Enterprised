import React, { useState } from 'react';
import {
  X,
  Shield,
  Key,
  Lock,
  RefreshCw,
  Copy,
  Check,
  CheckCircle2,
  Terminal,
  Layers,
  Zap,
} from 'lucide-react';
import { useCollabStore } from '../../store/useCollabStore';
import { AppleIcon, GoogleIcon } from './AuthPage';

export const AuthInspectorModal: React.FC = () => {
  const {
    isAuthInspectorOpen,
    setAuthInspectorOpen,
    authSession,
    currentUser,
    enterpriseTrial,
  } = useCollabStore();

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tokens' | 'claims' | 'sso_providers' | 'rbac'>('tokens');

  if (!isAuthInspectorOpen) return null;

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Decode JWT payload for visualization
  let decodedPayload: Record<string, unknown> = {};
  try {
    const parts = (authSession?.accessToken || '').split('.');
    if (parts.length >= 2) {
      decodedPayload = JSON.parse(atob(parts[1]));
    }
  } catch {
    decodedPayload = {
      user_id: currentUser.id,
      email: currentUser.email,
      role: currentUser.role,
      name: currentUser.name,
      iat: Math.floor(Date.now() / 1000) - 120,
      exp: Math.floor(Date.now() / 1000) + 780,
    };
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-100">CollabFlow Authentication & Token Inspector</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono">
                  OIDC / JWT
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Active Session: <span className="text-indigo-300 font-semibold">{authSession?.methodLabel}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setAuthInspectorOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close auth inspector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 border-b border-slate-800 flex gap-2 shrink-0 bg-slate-950/40">
          {(
            [
              { id: 'tokens', label: 'JWT Tokens & Session', icon: Key },
              { id: 'claims', label: 'Decoded Claims', icon: Terminal },
              { id: 'sso_providers', label: 'SSO Integrations', icon: Layers },
              { id: 'rbac', label: 'RBAC & Trial', icon: Zap },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 py-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
                  isActive
                    ? 'border-indigo-500 text-white bg-slate-900/50'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {activeTab === 'tokens' && (
            <div className="space-y-4">
              {/* Token Summary Card */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Provider</span>
                  <span className="font-semibold text-slate-200 capitalize">{authSession?.provider}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Token Type</span>
                  <span className="font-mono text-indigo-400 font-semibold">Bearer (HS256)</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Rotation Cycle</span>
                  <span className="font-mono text-emerald-400 font-semibold">#{authSession?.tokenRotationCount || 1}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Expires In</span>
                  <span className="font-mono text-amber-400 font-semibold">
                    ~{Math.max(1, Math.round(((authSession?.expiresAt || Date.now()) - Date.now()) / 60000))}m
                  </span>
                </div>
              </div>

              {/* Access Token */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Access Token (15-min TTL)</span>
                  </label>
                  <button
                    onClick={() => handleCopy(authSession?.accessToken || '', 'access')}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                  >
                    {copiedKey === 'access' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-400 break-all select-all">
                  {authSession?.accessToken}
                </div>
              </div>

              {/* Refresh Token */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Refresh Token (7-day TTL with Blacklist Rotation)</span>
                  </label>
                  <button
                    onClick={() => handleCopy(authSession?.refreshToken || '', 'refresh')}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                  >
                    {copiedKey === 'refresh' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-400 break-all select-all">
                  {authSession?.refreshToken}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'claims' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Payload claims signed by CollabFlow identity provider. Transported via <code className="text-indigo-300 bg-slate-800 px-1 py-0.5 rounded">Authorization: Bearer</code> headers to Daphne ASGI and Django REST endpoints.
              </p>
              <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed">
                {JSON.stringify(decodedPayload, null, 2)}
              </pre>
            </div>
          )}

          {activeTab === 'sso_providers' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5">
                      <div className="bg-[#f25022]" />
                      <div className="bg-[#7fba00]" />
                      <div className="bg-[#00a4ef]" />
                      <div className="bg-[#ffb900]" />
                    </div>
                    <span className="font-bold text-xs text-white">Microsoft Identity Platform (Entra ID)</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono font-semibold">
                    CONNECTED
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Supports Multi-tenant Azure AD organizations, School/Work accounts, and Personal Microsoft / Outlook.com accounts using OAuth 2.0 PKCE flow.
                </p>
              </div>

              {/* GOOGLE / GMAIL */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GoogleIcon className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-bold text-xs text-white">Google Identity & Gmail SSO</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono font-semibold">
                    CONNECTED
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Google OAuth 2.0 / OpenID Connect authorization with multi-account picker and instant sign-in for Gmail and Google Workspace accounts.
                </p>
              </div>

              {/* APPLE */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AppleIcon className="w-3.5 h-3.5 text-white shrink-0" />
                    <span className="font-bold text-xs text-white">Sign in with Apple</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono font-semibold">
                    CONNECTED
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Apple ID OIDC flow with biometric Face ID / Touch ID passkeys, and support for Apple Private Email Relay forwarding (<code className="text-slate-300 font-mono">@privaterelay.appleid.com</code>).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="font-bold text-xs text-white">Phone SMS Gateway & 2FA</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono font-semibold">
                    ACTIVE
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  International E.164 dialing validation across 10+ countries with rate-limited one-time password verification codes.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'rbac' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-950/40 via-violet-950/40 to-slate-950/80 border border-indigo-800/50 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white">{enterpriseTrial.planName}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-semibold border border-indigo-500/30">
                      {enterpriseTrial.tier}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Full enterprise access granted with unthrottled WebSocket channel bandwidth.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-white font-mono">{enterpriseTrial.daysRemaining}</span>
                  <span className="text-[10px] block text-slate-400">days left</span>
                </div>
              </div>

              <div>
                <h5 className="text-xs font-bold text-slate-300 mb-2">Active Enterprise Capabilities</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {enterpriseTrial.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/50 border border-slate-800 text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between text-xs text-slate-400">
          <span>CollabFlow Security Framework v3.4</span>
          <button
            onClick={() => setAuthInspectorOpen(false)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
