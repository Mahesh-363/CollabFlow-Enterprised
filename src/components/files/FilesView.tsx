import React, { useState, useRef } from 'react';
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
  X,
  AlertCircle,
  FileCheck,
  CheckCircle2,
} from 'lucide-react';
import { useCollabStore } from '../../store/useCollabStore';
import { UserAvatar } from '../UserAvatar';
import { WorkspaceFile } from '../../types/collab';
import {
  validateUploadFile,
  formatFileSize,
  detectFileCategory,
  MAX_FILE_SIZE_BYTES,
} from '../../utils/fileUploadLogic';
import { apiClient } from '../../api/client';

interface SelectedUploadItem {
  id: string;
  file: File;
  name: string;
  type: WorkspaceFile['type'];
  size: string;
  sizeBytes: number;
  previewUrl?: string;
  error?: string;
}

export const FilesView: React.FC = () => {
  const {
    workspaceFiles,
    users,
    uploadWorkspaceFile,
    deleteWorkspaceFile,
    currentUser,
    backendConnected,
    activeChannelId,
  } = useCollabStore();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<WorkspaceFile | null>(null);

  // Upload queue & drag-and-drop state
  const [uploadQueue, setUploadQueue] = useState<SelectedUploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isRealBackend = Boolean(import.meta.env.VITE_API_URL) && backendConnected;

  const filteredFiles = workspaceFiles.filter((f) => {
    if (activeCategory !== 'all' && f.type !== activeCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!f.name.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const handleFilesAdded = (incomingFiles: FileList | File[]) => {
    setUploadError(null);
    setUploadSuccess(null);

    const newItems: SelectedUploadItem[] = [];

    Array.from(incomingFiles).forEach((file) => {
      const validation = validateUploadFile({ name: file.name, size: file.size });
      const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;

      newItems.push({
        id: `upload-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        name: file.name,
        type: validation.category,
        size: formatFileSize(file.size),
        sizeBytes: file.size,
        previewUrl,
        error: validation.valid ? undefined : validation.error,
      });
    });

    setUploadQueue((prev) => [...prev, ...newItems]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  const removeQueueItem = (id: string) => {
    setUploadQueue((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  const updateItemName = (id: string, newName: string) => {
    setUploadQueue((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const validation = validateUploadFile({ name: newName, size: item.sizeBytes });
        return {
          ...item,
          name: newName,
          type: validation.category,
          error: validation.valid ? undefined : validation.error,
        };
      })
    );
  };

  const updateItemType = (id: string, newType: WorkspaceFile['type']) => {
    setUploadQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, type: newType } : item))
    );
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadQueue.length === 0) {
      setUploadError('Please select at least one file to upload.');
      return;
    }

    const hasInvalidFiles = uploadQueue.some((i) => Boolean(i.error));
    if (hasInvalidFiles) {
      setUploadError('Please remove or correct files with validation errors before uploading.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    setUploadProgress(15);

    try {
      if (isRealBackend) {
        // Real Mode: upload with multipart/form-data to /files/
        const total = uploadQueue.length;
        for (let idx = 0; idx < total; idx++) {
          const item = uploadQueue[idx];
          const formData = new FormData();
          formData.append('file', item.file, item.name);
          if (activeChannelId) {
            formData.append('channelId', activeChannelId);
          }

          const res = await apiClient.files.upload(formData);
          if (res) {
            uploadWorkspaceFile({
              name: res.name || item.name,
              type: (res.type as WorkspaceFile['type']) || item.type,
              size: res.size || item.size,
              sizeBytes: res.sizeBytes || item.sizeBytes,
              url: res.url || URL.createObjectURL(item.file),
              uploadedBy: currentUser.id,
            });
          }
          setUploadProgress(Math.round(((idx + 1) / total) * 100));
        }
      } else {
        // Demo Mode: store selected file in the browser (object URL kept for session)
        const total = uploadQueue.length;
        for (let idx = 0; idx < total; idx++) {
          const item = uploadQueue[idx];
          // Retain live object URL for downloading / previewing real file
          const objectUrl = item.previewUrl || URL.createObjectURL(item.file);

          uploadWorkspaceFile({
            name: item.name,
            type: item.type,
            size: item.size,
            sizeBytes: item.sizeBytes,
            url: objectUrl,
            uploadedBy: currentUser.id,
          });
          setUploadProgress(Math.round(((idx + 1) / total) * 100));
        }
      }

      setUploadSuccess(`Successfully uploaded ${uploadQueue.length} file(s)!`);
      setTimeout(() => {
        setIsUploading(false);
        setIsUploadModalOpen(false);
        setUploadQueue([]);
        setUploadProgress(0);
        setUploadSuccess(null);
      }, 700);
    } catch (err: any) {
      setIsUploading(false);
      setUploadError(err?.message || 'Failed to complete file upload.');
    }
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
      case 'archive':
        return <FolderGit2 className="w-5 h-5 text-amber-400" />;
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
          onClick={() => {
            setUploadQueue([]);
            setUploadError(null);
            setUploadSuccess(null);
            setIsUploadModalOpen(true);
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02] self-start sm:self-auto cursor-pointer"
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
                      className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-indigo-300 transition-colors line-clamp-1 cursor-pointer"
                      title={file.name}
                      onClick={() => setPreviewFile(file)}
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
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Preview details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        const a = document.createElement('a');
                        a.href = file.url;
                        a.download = file.name;
                        a.target = '_blank';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                      }}
                      className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => deleteWorkspaceFile(file.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
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
          <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4 text-xs max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-400" />
                <span>Upload to Workspace</span>
              </h2>
              <button
                type="button"
                onClick={() => {
                  if (!isUploading) setIsUploadModalOpen(false);
                }}
                className="text-slate-400 hover:text-white text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* Demo Mode Notice */}
            {!isRealBackend && (
              <div className="px-3 py-2 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-[11px] text-indigo-300 flex items-center justify-between gap-2">
                <span>ℹ Demo mode: uploads are kept in this browser session and preview/download will open the real files.</span>
                <span className="font-mono text-[10px] text-indigo-400 shrink-0">Local Session</span>
              </div>
            )}

            {/* Error / Success Banners */}
            {uploadError && (
              <div className="px-3 py-2 rounded-xl bg-rose-950/50 border border-rose-500/40 text-[11px] text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}
            {uploadSuccess && (
              <div className="px-3 py-2 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-[11px] text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="flex-1 flex flex-col min-h-0 space-y-4">
              {/* Native file picker + Drag & Drop zone */}
              <div
                onDragOver={handleDragOver}
                onDragEnter={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2.5 ${
                  isDragging
                    ? 'border-indigo-400 bg-indigo-950/30 ring-2 ring-indigo-500/30'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">
                    <span className="text-indigo-400 font-bold hover:underline">Choose files</span> or drag and drop here
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    PDF, Office, Images, Media, Code, Archives (Max 50 MB per file)
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFilesAdded(e.target.files);
                      e.target.value = '';
                    }
                  }}
                  className="hidden"
                />
              </div>

              {/* Selected Files Preview List */}
              {uploadQueue.length > 0 && (
                <div className="flex-1 min-h-0 flex flex-col space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span>
                      Selected Files ({uploadQueue.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setUploadQueue([])}
                      className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="overflow-y-auto max-h-52 space-y-2 pr-1">
                    {uploadQueue.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          item.error
                            ? 'bg-rose-950/20 border-rose-800/60'
                            : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {item.previewUrl ? (
                            <img
                              src={item.previewUrl}
                              alt={item.name}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-800 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                              {getFileIcon(item.type)}
                            </div>
                          )}

                          <div className="min-w-0 flex-1 space-y-1">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateItemName(item.id, e.target.value)}
                              placeholder="File name"
                              className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-medium"
                            />
                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                              <span>{item.size}</span>
                              <span>•</span>
                              <span className="uppercase font-mono">{item.type}</span>
                            </div>
                            {item.error && (
                              <p className="text-[10px] text-rose-400 font-medium flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                <span>{item.error}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <select
                            value={item.type}
                            onChange={(e) =>
                              updateItemType(item.id, e.target.value as WorkspaceFile['type'])
                            }
                            className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                          >
                            <option value="document">Document</option>
                            <option value="image">Image</option>
                            <option value="code">Code</option>
                            <option value="media">Media</option>
                            <option value="archive">Archive</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => removeQueueItem(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Remove file"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Progress State */}
              {isUploading && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px] text-indigo-300">
                    <span>Uploading files...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Footer Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800 mt-auto">
                <span className="text-[11px] text-slate-500">
                  Max file size: 50 MB
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => setIsUploadModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isUploading ||
                      uploadQueue.length === 0 ||
                      uploadQueue.some((i) => Boolean(i.error))
                    }
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>
                      {isUploading
                        ? 'Uploading...'
                        : `Confirm Upload (${uploadQueue.filter((i) => !i.error).length})`}
                    </span>
                  </button>
                </div>
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
                <span className="truncate max-w-sm">{previewFile.name}</span>
              </h2>
              <button
                onClick={() => setPreviewFile(null)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* Thumbnail preview for image files */}
            {previewFile.type === 'image' && (
              <div className="max-h-60 overflow-hidden rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center p-2">
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  className="max-h-56 max-w-full object-contain rounded-lg"
                />
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <p className="text-slate-300">
                <strong className="text-white">File Name:</strong> {previewFile.name}
              </p>
              <p className="text-slate-300">
                <strong className="text-white">Category:</strong>{' '}
                <span className="uppercase font-mono text-indigo-300">{previewFile.type}</span>
              </p>
              <p className="text-slate-300">
                <strong className="text-white">File Size:</strong> {previewFile.size}
              </p>
              <p className="text-slate-300">
                <strong className="text-white">Uploaded Date:</strong> {previewFile.uploadedAt}
              </p>
              <p className="text-slate-300">
                <strong className="text-white">Direct URL / Blob:</strong>{' '}
                <span className="font-mono text-indigo-400 break-all">{previewFile.url}</span>
              </p>
              {!isRealBackend && (
                <p className="text-amber-400/90 text-[11px] flex items-center gap-1.5 pt-1">
                  <span>ℹ Demo uploads stay in this browser only.</span>
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <a
                href={previewFile.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5"
              >
                <Eye className="w-4 h-4" />
                <span>Open Real File</span>
              </a>

              <button
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = previewFile.url;
                  a.download = previewFile.name;
                  a.target = '_blank';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>

              <button
                onClick={() => setPreviewFile(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
