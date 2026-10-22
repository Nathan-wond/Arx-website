import fs from 'fs';
import path from 'path';
import os from 'os';

const MAX_FILE_SIZE = 10 * 1024 * 1024; 

const ALLOWED_MIME_TYPES = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

export function formatBytes(bytes, decimals = 1) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function validateFileMagicBytes(buffer, claimedMime) {
  if (buffer.length < 8) {
    return { valid: false, detectedMime: '', error: 'File is too small or empty.' };
  }

  
  if (
  buffer[0] === 0x25 &&
  buffer[1] === 0x50 &&
  buffer[2] === 0x44 &&
  buffer[3] === 0x46 &&
  buffer[4] === 0x2d)
  {
    return { valid: true, detectedMime: 'application/pdf' };
  }

  
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    return { valid: true, detectedMime: 'image/jpeg' };
  }

  
  if (
  buffer[0] === 0x89 &&
  buffer[1] === 0x50 &&
  buffer[2] === 0x4e &&
  buffer[3] === 0x47 &&
  buffer[4] === 0x0d &&
  buffer[5] === 0x0a &&
  buffer[6] === 0x1a &&
  buffer[7] === 0x0a)
  {
    return { valid: true, detectedMime: 'image/png' };
  }

  
  if (
  buffer[0] === 0x52 &&
  buffer[1] === 0x49 &&
  buffer[2] === 0x46 &&
  buffer[3] === 0x46 &&
  buffer.length >= 12 &&
  buffer[8] === 0x57 &&
  buffer[9] === 0x45 &&
  buffer[10] === 0x42 &&
  buffer[11] === 0x50)
  {
    return { valid: true, detectedMime: 'image/webp' };
  }

  return {
    valid: false,
    detectedMime: '',
    error: `Unsupported or invalid file format. Supported file formats: PDF, JPG, PNG, WebP. File content did not match expected signatures.`
  };
}

export function validateAndSaveAwardFile(
rawInput,
uploadsDir)
{
  let base64Data = '';
  let claimedMime = (rawInput.mimeType || '').toLowerCase().trim();

  if (rawInput.dataUrl && typeof rawInput.dataUrl === 'string') {
    const matches = rawInput.dataUrl.match(/^data:([A-Za-z0-9\/\-+.]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return { success: false, error: 'Invalid data URL format for uploaded award file.' };
    }
    claimedMime = matches[1].toLowerCase();
    base64Data = matches[2];
  } else if (rawInput.base64 && typeof rawInput.base64 === 'string') {
    base64Data = rawInput.base64;
  } else {
    return { success: false, error: 'No file data received for award upload.' };
  }

  let buffer;
  try {
    buffer = Buffer.from(base64Data, 'base64');
  } catch {
    return { success: false, error: 'Failed to decode base64 file data.' };
  }

  if (buffer.length === 0) {
    return { success: false, error: 'Uploaded award file cannot be empty.' };
  }

  if (buffer.length > MAX_FILE_SIZE) {
    return { success: false, error: `File size exceeds the 10MB limit (size: ${formatBytes(buffer.length)}).` };
  }

  
  const magicCheck = validateFileMagicBytes(buffer, claimedMime);
  if (!magicCheck.valid) {
    return { success: false, error: magicCheck.error || 'Invalid file format.' };
  }

  const finalMime = magicCheck.detectedMime;
  const canonicalExt = ALLOWED_MIME_TYPES[finalMime];
  if (!canonicalExt) {
    return { success: false, error: `MIME type ${finalMime} is not supported for award evidence.` };
  }

  
  const rawFilename = typeof rawInput.filename === 'string' ? rawInput.filename.trim() : 'award_document';
  const safeOriginalName = path.basename(rawFilename).replace(/[^\w\.\-\s]/g, '_');
  const safeBasename = path.
  parse(safeOriginalName).
  name.replace(/[^\w\-]/g, '_').
  slice(0, 40).
  toLowerCase() || 'award';

  
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  let targetDir = uploadsDir || (isServerless
    ? path.join(os.tmpdir(), 'arx_uploads', 'awards')
    : path.resolve(process.cwd(), 'uploads', 'awards'));

  const uniqueFilename = `award_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}_${safeBasename}.${canonicalExt}`;
  let filePath = '';

  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    filePath = path.join(targetDir, uniqueFilename);
    fs.writeFileSync(filePath, buffer);
  } catch (_firstErr) {
    
    try {
      targetDir = path.join(os.tmpdir(), 'arx_uploads', 'awards');
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      filePath = path.join(targetDir, uniqueFilename);
      fs.writeFileSync(filePath, buffer);
    } catch (_fallbackErr) {
      
      filePath = '';
    }
  }

  const relativeUrl = `/uploads/awards/${uniqueFilename}`;

  return {
    success: true,
    file: {
      originalFilename: safeOriginalName.endsWith(`.${canonicalExt}`) ? safeOriginalName : `${safeOriginalName}.${canonicalExt}`,
      filename: uniqueFilename,
      storagePath: filePath || undefined,
      url: relativeUrl,
      fileSize: buffer.length,
      formattedSize: formatBytes(buffer.length),
      mimeType: finalMime,
      base64: base64Data
    }
  };
}
