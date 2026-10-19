import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateUploadFile,
  detectFileCategory,
  formatFileSize,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_FILE_EXTENSIONS,
} from './fileUploadLogic.ts';

test('validateUploadFile accepts allowed extensions under 50MB', () => {
  const allowedSamples = [
    { name: 'architecture-spec.pdf', size: 1024 * 1024 },
    { name: 'dashboard-preview.png', size: 2 * 1024 * 1024 },
    { name: 'main.py', size: 5000 },
    { name: 'release-bundle.tar.gz', size: 15 * 1024 * 1024 },
    { name: 'screen-record.mp4', size: 40 * 1024 * 1024 },
  ];

  for (const sample of allowedSamples) {
    const res = validateUploadFile(sample);
    assert.equal(res.valid, true);
    assert.equal(res.error, undefined);
  }
});

test('validateUploadFile rejects disallowed extensions', () => {
  const blockedSamples = [
    { name: 'virus.exe', size: 1000 },
    { name: 'script.bat', size: 2000 },
    { name: 'installer.msi', size: 5000 },
    { name: 'hiddenfile', size: 3000 },
  ];

  for (const sample of blockedSamples) {
    const res = validateUploadFile(sample);
    assert.equal(res.valid, false);
    assert.match(res.error || '', /not allowed/i);
  }
});

test('validateUploadFile rejects files exceeding 50MB limit', () => {
  const oversize = {
    name: 'giant-recording.mp4',
    size: MAX_FILE_SIZE_BYTES + 1,
  };
  const res = validateUploadFile(oversize);
  assert.equal(res.valid, false);
  assert.match(res.error || '', /exceeds maximum allowed size/i);
});

test('detectFileCategory categorizes extensions correctly', () => {
  assert.equal(detectFileCategory('report.docx'), 'document');
  assert.equal(detectFileCategory('chart.svg'), 'image');
  assert.equal(detectFileCategory('service.ts'), 'code');
  assert.equal(detectFileCategory('podcast.mp3'), 'media');
  assert.equal(detectFileCategory('backup.7z'), 'archive');
});

test('formatFileSize converts bytes to readable units', () => {
  assert.equal(formatFileSize(512), '512 B');
  assert.equal(formatFileSize(2048), '2.0 KB');
  assert.equal(formatFileSize(10485760), '10.0 MB');
});
