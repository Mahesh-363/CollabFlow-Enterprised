import React, { useState } from 'react';
import {
  FolderGit2,
  Upload,
  Search,
  FileText,
  Image as ImageIcon,
  Code2,
  Video,
  Download,
  Trash2,
  Eye,
  Plus,
  Check,
} from 'lucide-react';
import { useCollabStore } from '../../store/useCollabStore';
import { UserAvatar } from '../UserAvatar';
import { WorkspaceFile } from '../../types/collab';

export const FilesView: React.FC = () => {
  const { workspaceFiles, users, uploadWorkspaceFile, deleteWorkspaceFile, currentUser } =
    useCollabStore();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<WorkspaceFile | null>(null);

  // Upload form state
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState<WorkspaceFile['type']>('document');
  const [fileSizeText, setFileSizeText] = useState('1.5 MB');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const filteredFiles = workspaceFiles.filter((f) => {
    if (activeCategory !== 'all' && f.type !== activeCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!f.name.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim()) return;

    setIsUploading(true);
    setUploadProgress(25);

    setTimeout(() => {
      setUploadProgress(70);
      setTimeout(() => {
        setUploadProgress(100);
        uploadWorkspaceFile({
          name: fileName.trim(),
          type: fileType,
          size: fileSizeText,
          sizeBytes: 1500000,
          url: 'https://assets.collabflow.internal/files/' + fileName.trim(),
          uploadedBy: currentUser.id,
        });
        setIsUploading(false);
        setIsUploadModalOpen(false);
        setFileName('');
        setUploadProgress(0);
      }, 400);
    }, 500);
  };

  const getFileIcon = (type: WorkspaceFile['type']) => {
    switch (type) {
      case 'document':
        return <FileText className="w-5 h-5 text-indigo-400" />;
      case 'image':
        return <ImageIcon className="w-5 h-5 text-emerald-400" />;
      case 'code':
        return <Code2 className="w-5 h-5 text-cyan-400" />;
      case 'media':
        return <Video className="w-5 h-5 text-pink-400" />;
      default:
        return <FileText className="w-5 h-5 text-indigo-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-5">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <FolderGit2 className="w-6 h-6 text-indigo-400" />
            <span>Files & Document Hub</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Central repository for shared assets, architecture specifications, spreadsheets, and design tokens
          </p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02] self-start sm:self-auto"
        >
          <Upload className="w-4 h-4" />
          <span>Upload File</span>
        </button>
      </div>

      {/* FILTER TABS & SEARCH */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
              activeCategory === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Files ({workspaceFiles.length})
          </button>
          <button
            onClick={() => setActiveCategory('document')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
              activeCategory === 'document' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Documents
          </button>
          <button
            onClick={() => setActiveCategory('image')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
              activeCategory === 'image' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Images
          </button>
          <button
            onClick={() => setActiveCategory('code')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
              activeCategory === 'code' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Code & Configs
          </button>
          <button
            onClick={() => setActiveCategory('media')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
              activeCategory === 'media' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Media
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by filename..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* FILES GRID */}
      {filteredFiles.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
          <FolderGit2 className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No files found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No workspace assets match your criteria. Upload diagrams, specifications, or data files.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFiles.map((file) => {
            const uploader = users.find((u) => u.id === file.uploadedBy);

            return (
              <div
                key={file.id}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3 group shadow-md"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                      {getFileIcon(file.type)}
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase bg-slate-950 text-slate-400 border border-slate-800">
                      {file.type}
                    </span>
                  </div>

                  <div>
                    <h3
                      className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-indigo-300 transition-colors line-clamp-1"
                      title={file.name}
                    >
                      {file.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {file.size} • Uploaded {file.uploadedAt}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    {uploader && <UserAvatar user={uploader} size="xs" showPresence={false} />}
                    <span className="truncate max-w-[80px]">{uploader?.name.split(' ')[0]}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPreviewFile(file)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                      title="Preview details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        // Download simulation
                        const a = document.createElement('a');
                        a.href = file.url;
                        a.download = file.name;
                        a.target = '_blank';
                        a.click();
                      }}
                      className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => deleteWorkspaceFile(file.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* UPLOAD MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-400" />
                <span>Upload to Workspace</span>
              </h2>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3.5">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">File Name *</label>
                <input
                  type="text"
                  required
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="e.g. Mediasoup_SFU_Signaling_Spec.pdf"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="document">Document (PDF / Office)</option>
                    <option value="image">Image (PNG / SVG)</option>
                    <option value="code">Code / Config</option>
                    <option value="media">Video / Audio</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Size</label>
                  <input
                    type="text"
                    value={fileSizeText}
                    onChange={(e) => setFileSizeText(e.target.value)}
                    placeholder="e.g. 2.4 MB"
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              {isUploading && (
                <div className="space-y-1 pt-2">
                  <div className="flex justify-between text-[11px] text-indigo-300">
                    <span>Uploading file...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md shadow-indigo-600/30"
                >
                  {isUploading ? 'Uploading...' : 'Confirm Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {getFileIcon(previewFile.type)}
                <span>{previewFile.name}</span>
              </h2>
              <button
                onClick={() => setPreviewFile(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <p className="text-slate-300">
                <strong className="text-white">File Size:</strong> {previewFile.size}
              </p>
              <p className="text-slate-300">
                <strong className="text-white">Uploaded Date:</strong> {previewFile.uploadedAt}
              </p>
              <p className="text-slate-300">
                <strong className="text-white">Direct URL:</strong>{' '}
                <span className="font-mono text-indigo-400 break-all">{previewFile.url}</span>
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPreviewFile(null)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
