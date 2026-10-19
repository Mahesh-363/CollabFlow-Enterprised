import type { WorkspaceFile } from '../types/collab.js';

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

// Mirrored strictly from backend/apps/files/serializers.py
export const ALLOWED_FILE_EXTENSIONS = new Set<string>([
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'txt',
  'md',
  'csv',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'svg',
  'webp',
  'ts',
  'tsx',
  'js',
  'jsx',
  'py',
  'json',
  'yaml',
  'yml',
  'sql',
  'html',
  'css',
  'mp4',
  'webm',
  'mov',
  'mp3',
  'wav',
  'zip',
  'tar',
  'gz',
  '7z',
]);

// Mirrored from backend/apps/files/views.py CATEGORY_MAP
export function detectFileCategory(fileName: string): WorkspaceFile['type'] {
  const parts = fileName.split('.');
  const ext = parts.length > 1 ? (parts.pop() || '').toLowerCase() : '';

  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
    return 'image';
  }
  if (['ts', 'tsx', 'js', 'jsx', 'py', 'json', 'yaml', 'yml', 'sql', 'html', 'css'].includes(ext)) {
    return 'code';
  }
  if (['mp4', 'webm', 'mov', 'mp3', 'wav'].includes(ext)) {
    return 'media';
  }
  if (['zip', 'tar', 'gz', '7z'].includes(ext)) {
    return 'archive';
  }
  return 'document';
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateUploadFile(file: { name: string; size: number }): {
  valid: boolean;
  error?: string;
  category: WorkspaceFile['type'];
  extension: string;
} {
  const parts = file.name.split('.');
  const extension = parts.length > 1 ? (parts.pop() || '').toLowerCase() : '';
  const category = detectFileCategory(file.name);

  if (!extension || !ALLOWED_FILE_EXTENSIONS.has(extension)) {
    return {
      valid: false,
      error: `Extension .${extension || 'unknown'} is not allowed. Supported formats: Documents, Images, Media, Code, Archives.`,
      category,
      extension,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File exceeds maximum allowed size of 50 MB (${formatFileSize(file.size)}).`,
      category,
      extension,
    };
  }

  return {
    valid: true,
    category,
    extension,
  };
}
