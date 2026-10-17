import React, { useState } from 'react';
import {
  X,
  Code2,
  Copy,
  Check,
  FolderTree,
  Server,
  Layers,
  Terminal,
  FileText,
  BookOpen,
  Sparkles,
  Download,
} from 'lucide-react';
import { useCollabStore } from '../store/useCollabStore';
import { PRODUCTION_CODEBASE, CodeFile } from '../data/productionCodebase';

type ExplorerTab =
  | 'tree'
  | 'backend'
  | 'frontend'
  | 'infrastructure'
  | 'env'
  | 'commands'
  | 'readme';

export const ArchitectureExplorerModal: React.FC = () => {
  const { isArchitectureOpen, setArchitectureOpen } = useCollabStore();
  const [activeTab, setActiveTab] = useState<ExplorerTab>('tree');
  const [selectedFile, setSelectedFile] = useState<CodeFile>(PRODUCTION_CODEBASE[0]);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setArchitectureOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setArchitectureOpen]);

  if (!isArchitectureOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAll = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(PRODUCTION_CODEBASE, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'collabflow-complete-production-codebase.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const folderStructureTree = `
collabflow/
├── backend/
│   ├── collabflow/
│   │   ├── __init__.py
│   │   ├── asgi.py              # Daphne ASGI protocol router & WebSocket URL routing
│   │   ├── settings.py          # Production Django settings (JWT, Celery, Redis Channel Layer)
│   │   ├── urls.py              # Global URL routing
│   │   └── wsgi.py
│   ├── apps/
│   │   ├── accounts/
│   │   │   ├── models.py        # Custom User model (roles: Owner/Admin/Member/Guest, presence)
│   │   │   ├── serializers.py   # User & Auth serializers
│   │   │   └── views.py         # Login, JWT refresh rotation, user profiles
│   │   ├── workspaces/
│   │   │   ├── models.py        # Workspace & WorkspaceMember RBAC
│   │   │   └── views.py
│   │   ├── channels_app/
│   │   │   ├── models.py        # Public & private channels, unread counters
│   │   │   └── views.py
│   │   ├── messages_app/
│   │   │   ├── models.py        # Message, ThreadReply, MessageReaction, Attachment
│   │   │   ├── consumers.py     # High-throughput AsyncJsonWebsocketConsumer (Daphne)
│   │   │   ├── routing.py       # WebSocket URL patterns (/ws/chat/<channel_id>/)
│   │   │   ├── tasks.py         # Celery tasks (push notifications, fan-out, token pruning)
│   │   │   └── views.py         # REST views with full-text search
│   │   └── presence/
│   │       ├── middleware.py    # JWT Auth WebSocket middleware stack
│   │       └── consumers.py     # Global presence heartbeat consumer
│   ├── scripts/
│   │   └── seed_data.py         # Automated database seeding script
│   ├── Dockerfile               # Production multi-stage Daphne ASGI container
│   └── requirements.txt
├── frontend/
│   ├── app/ (Next.js App Router)
│   │   ├── layout.tsx
│   │   ├── page.tsx             # Root workspace launcher
│   │   └── [workspace]/[channel]/page.tsx
│   ├── src/
│   │   ├── components/          # Sidebar, ChatArea, MessageItem, ThreadPanel, HuddleBar
│   │   ├── store/               # Zustand reactive store (messages, reactions, presence)
│   │   ├── hooks/               # useSocket (WebSocket lifecycle), useChatQuery
│   │   └── lib/                 # apiClient (Axios with automatic JWT rotation interceptor)
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml           # PostgreSQL 16, Redis 7, Daphne, Celery, Nginx, Next.js
├── nginx/
│   └── nginx.conf               # WebSocket upgrade proxy & SSL termination
├── .github/
│   └── workflows/deploy.yml     # Automated CI/CD (Test, Lint, Render & Vercel deploy)
├── .env.example
└── README.md
`;

  const terminalCommands = `
# ==============================================================================
# 1. LOCAL DEVELOPMENT SETUP (RUN ENTIRE STACK IN 3 COMMANDS)
# ==============================================================================

# Step 1: Start PostgreSQL 16 & Redis 7.2 via Docker
docker compose up -d db redis

# Step 2: Set up Python virtual environment and run backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python scripts/seed_data.py
daphne -b 0.0.0.0 -p 8000 collabflow.asgi:application

# Step 3: Run Celery background worker (in a separate terminal)
celery -A collabflow worker --loglevel=info -c 4

# Step 4: Run Next.js frontend (in a separate terminal)
cd frontend
npm install
npm run dev

# Open http://localhost:3000 to interact with CollabFlow.


# ==============================================================================
# 2. PRODUCTION DEPLOYMENT TO RENDER (BACKEND + REDIS + POSTGRESQL)
# ==============================================================================

# Option A: Deploy with render.yaml Blueprint (Recommended)
# Push code to GitHub, connect repo in Render Dashboard, click 'Apply Blueprint'.

# Option B: Manual CLI / Web Service Deployment:
# 1. Create a Managed PostgreSQL Database on Render (select Postgres 16).
# 2. Create a Managed Redis Instance on Render.
# 3. Create a Web Service for Backend:
#    - Environment: Docker (uses backend/Dockerfile)
#    - Build Command: automatic via Dockerfile
#    - Start Command: daphne -b 0.0.0.0 -p $PORT collabflow.asgi:application
#    - Set Environment Variables:
#        SECRET_KEY=production-secret-key-32-chars-min
#        DEBUG=False
#        DATABASE_URL=<Render Internal PostgreSQL URL>
#        REDIS_URL=<Render Internal Redis URL>
#        CORS_ALLOWED_ORIGINS=https://collabflow.vercel.app

# 4. Create a Background Worker for Celery:
#    - Start Command: celery -A collabflow worker --loglevel=info


# ==============================================================================
# 3. PRODUCTION DEPLOYMENT TO VERCEL (FRONTEND)
# ==============================================================================

# Install Vercel CLI & Deploy
cd frontend
npm install -g vercel
vercel login
vercel --prod

# Configure Production Environment Variables in Vercel:
# NEXT_PUBLIC_API_URL=https://collabflow-backend.onrender.com/api
# NEXT_PUBLIC_WS_URL=wss://collabflow-backend.onrender.com/ws
`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-6xl h-[88vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* MODAL HEADER */}
        <div className="h-16 px-6 border-b border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  CollabFlow Production Architecture & Source Code Hub
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-mono font-semibold">
                  FAANG Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Complete Django, Channels, Celery, Redis, Docker, Nginx & Next.js codebase
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm"
              title="Download all source files as JSON archive"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Codebase</span>
            </button>
            <button
              onClick={() => setArchitectureOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="px-6 border-b border-slate-800 bg-slate-950/60 flex items-center gap-1 overflow-x-auto shrink-0 py-2">
          <button
            onClick={() => setActiveTab('tree')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'tree'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/50'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>1. Folder Structure</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('backend');
              setSelectedFile(PRODUCTION_CODEBASE[0]);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'backend'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/50'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>2. Backend (Django / Channels / Celery)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('infrastructure');
              setSelectedFile(PRODUCTION_CODEBASE.find((f) => f.path.includes('docker-compose')) || PRODUCTION_CODEBASE[0]);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'infrastructure'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/50'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>3. Docker, Nginx & CI/CD</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('env');
              setSelectedFile(PRODUCTION_CODEBASE.find((f) => f.path.includes('.env')) || PRODUCTION_CODEBASE[0]);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'env'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/50'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>4. Environment Variables</span>
          </button>

          <button
            onClick={() => setActiveTab('commands')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'commands'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/50'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>5. Terminal Commands & Deploy</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('readme');
              setSelectedFile(PRODUCTION_CODEBASE.find((f) => f.path.includes('README')) || PRODUCTION_CODEBASE[0]);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'readme'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/50'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>6. Complete README</span>
          </button>
        </div>

        {/* CONTENT VIEWPORT */}
        <div className="flex-1 overflow-hidden flex">
          {activeTab === 'tree' ? (
            /* FOLDER STRUCTURE VIEW */
            <div className="flex-1 p-6 overflow-y-auto font-mono text-xs text-slate-300 bg-slate-950 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="font-sans font-bold text-sm text-slate-100">
                  Complete Production Monorepo Structure
                </span>
                <button
                  onClick={() => handleCopy(folderStructureTree)}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-sans transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied tree' : 'Copy tree'}</span>
                </button>
              </div>
              <pre className="text-indigo-300 bg-slate-900/80 p-4 rounded-xl border border-slate-800 overflow-x-auto leading-relaxed">
                {folderStructureTree}
              </pre>
            </div>
          ) : activeTab === 'commands' ? (
            /* TERMINAL COMMANDS VIEW */
            <div className="flex-1 p-6 overflow-y-auto font-mono text-xs text-slate-300 bg-slate-950 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="font-sans font-bold text-sm text-slate-100">
                    Local Setup & Cloud Deployment Terminal Commands
                  </span>
                  <p className="font-sans text-xs text-slate-400 mt-0.5">
                    Execute locally via Docker or deploy directly to Render (Daphne/Redis) and Vercel (Next.js)
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(terminalCommands)}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-sans transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Commands'}</span>
                </button>
              </div>
              <pre className="text-emerald-400 bg-slate-900/90 p-4 rounded-xl border border-slate-800 overflow-x-auto leading-relaxed">
                {terminalCommands}
              </pre>
            </div>
          ) : (
            /* CODE FILE EXPLORER VIEW (SPLIT PANE) */
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Left File List */}
              <div className="w-full md:w-72 h-36 md:h-auto border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/80 overflow-y-auto p-2 space-y-1 shrink-0">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {activeTab.toUpperCase()} FILES
                </div>
                {PRODUCTION_CODEBASE.filter((f) => {
                  if (activeTab === 'backend') return f.category === 'backend' || f.category === 'scripts';
                  if (activeTab === 'infrastructure') return f.category === 'infrastructure';
                  if (activeTab === 'env') return f.category === 'config';
                  if (activeTab === 'readme') return f.category === 'docs';
                  return true;
                }).map((file) => (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left p-2 rounded-lg text-xs transition-colors ${
                      selectedFile.path === file.path
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 font-semibold'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-mono text-[11px] truncate">{file.path}</div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">{file.description}</div>
                  </button>
                ))}
              </div>

              {/* Right Code Display */}
              <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
                <div className="h-12 px-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/60">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-200">
                      {selectedFile.path}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      {selectedFile.language}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(selectedFile.content)}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy File'}</span>
                  </button>
                </div>

                <div className="flex-1 overflow-auto p-4">
                  <pre className="font-mono text-xs text-slate-200 leading-relaxed">
                    {selectedFile.content}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
