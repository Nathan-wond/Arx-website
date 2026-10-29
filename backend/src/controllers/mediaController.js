import {} from '../middleware/authMiddleware.js';
import { db } from '../services/db.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

function getUploadsDir() {
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  let dir = isServerless ? path.join(os.tmpdir(), 'uploads') : path.resolve(process.cwd(), 'uploads');
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  } catch {
    dir = path.join(os.tmpdir(), 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function formatBytes(bytes, decimals = 1) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const ALLOWED_MIME_TYPES = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
  // Note: SVG intentionally excluded — SVGs can contain embedded JavaScript (XSS risk)
};

export const mediaController = {
  
  getAll(req, res) {
    const { category, q } = req.query;
    const media = db.getAllMedia({
      category: typeof category === 'string' ? category : undefined,
      q: typeof q === 'string' ? q : undefined
    });

    res.json({ media });
  },

  
  getById(req, res) {
    const { id } = req.params;
    const item = db.getMediaById(id);
    if (!item) {
      res.status(404).json({ error: 'Image not found.' });
      return;
    }
    const usage = db.getImageUsage(id);
    res.json({ media: item, usage });
  },

  
  getUsage(req, res) {
    const { id } = req.params;
    const usage = db.getImageUsage(id);
    res.json(usage);
  },

  
  upload(req, res) {
    const { dataUrl, filename, title, altText, description, category, tags, width, height } = req.body;

    if (!dataUrl || typeof dataUrl !== 'string') {
      res.status(400).json({ error: 'Valid image data is required.' });
      return;
    }

    
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      res.status(400).json({ error: 'Invalid image data URL format.' });
      return;
    }

    const mimeType = matches[1].toLowerCase();
    const base64Data = matches[2];

    
    if (!ALLOWED_MIME_TYPES[mimeType]) {
      res.status(400).json({
        error: `Unsupported image format (${mimeType}). Please upload JPG, PNG, or WebP.`
      });
      return;
    }

    const buffer = Buffer.from(base64Data, 'base64');

    
    if (buffer.length > 15 * 1024 * 1024) {
      res.status(400).json({ error: 'Image file size exceeds the 15MB limit.' });
      return;
    }

    
    if (mimeType === 'image/jpeg' && (buffer[0] !== 0xff || buffer[1] !== 0xd8)) {
      res.status(400).json({ error: 'File content does not match a valid JPEG image.' });
      return;
    }
    if (mimeType === 'image/png' && (buffer[0] !== 0x89 || buffer[1] !== 0x50)) {
      res.status(400).json({ error: 'File content does not match a valid PNG image.' });
      return;
    }
    if (mimeType === 'image/webp' && (buffer.length < 12 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP')) {
      res.status(400).json({ error: 'File content does not match a valid WebP image.' });
      return;
    }

    
    const uploadsDir = getUploadsDir();

    const ext = ALLOWED_MIME_TYPES[mimeType];
    const cleanBasename = filename ?
    path.basename(filename).replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase() :
    'image';
    const uniqueFilename = `img_${Date.now()}_${Math.floor(Math.random() * 10000)}_${cleanBasename}.${ext}`;
    const filePath = path.join(uploadsDir, uniqueFilename);

    try {
      fs.writeFileSync(filePath, buffer);
    } catch (err) {
      console.error('Failed to write image to disk:', err);
      res.status(500).json({ error: 'Failed to save image to server storage.' });
      return;
    }

    const relativeUrl = `/uploads/${uniqueFilename}`;
    const parsedWidth = typeof width === 'number' && width > 0 ? width : 800;
    const parsedHeight = typeof height === 'number' && height > 0 ? height : 600;

    const item = db.createMedia({
      filename: uniqueFilename,
      url: relativeUrl,
      thumbnailUrl: relativeUrl,
      title: title?.trim() || cleanBasename.replace(/_/g, ' ') || 'Untitled Image',
      altText: altText?.trim() || title?.trim() || cleanBasename.replace(/_/g, ' ') || 'ARX IT CLUB OF SJS image',
      description: description?.trim() || '',
      category: category || 'General',
      tags: Array.isArray(tags) ? tags : tags ? String(tags).split(',').map((t) => t.trim()) : [],
      width: parsedWidth,
      height: parsedHeight,
      fileSize: buffer.length,
      formattedSize: formatBytes(buffer.length),
      mimeType
    });

    res.status(201).json({
      success: true,
      message: 'Image uploaded and processed successfully.',
      media: item
    });
  },

  
  updateMetadata(req, res) {
    const { id } = req.params;
    const { title, altText, description, category, tags } = req.body;

    const existing = db.getMediaById(id);
    if (!existing) {
      res.status(404).json({ error: 'Image not found.' });
      return;
    }

    const updated = db.updateMedia(id, {
      title: title !== undefined ? String(title).trim() : existing.title,
      altText: altText !== undefined ? String(altText).trim() : existing.altText,
      description: description !== undefined ? String(description).trim() : existing.description,
      category: category !== undefined ? category : existing.category,
      tags: Array.isArray(tags) ?
      tags :
      tags !== undefined ? String(tags).split(',').map((t) => t.trim()).filter(Boolean) : existing.tags
    });

    res.json({
      success: true,
      message: 'Image details updated successfully.',
      media: updated
    });
  },

  
  replaceImage(req, res) {
    const { id } = req.params;
    const { dataUrl, filename, width, height, replaceEverywhere } = req.body;

    const existing = db.getMediaById(id);
    if (!existing) {
      res.status(404).json({ error: 'Original image not found.' });
      return;
    }

    if (!dataUrl || typeof dataUrl !== 'string') {
      res.status(400).json({ error: 'New image data URL is required for replacement.' });
      return;
    }

    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      res.status(400).json({ error: 'Invalid image data URL format.' });
      return;
    }

    const mimeType = matches[1].toLowerCase();
    const base64Data = matches[2];

    if (!ALLOWED_MIME_TYPES[mimeType]) {
      res.status(400).json({ error: `Unsupported image format (${mimeType}).` });
      return;
    }

    const buffer = Buffer.from(base64Data, 'base64');
    const uploadsDir = getUploadsDir();
    const ext = ALLOWED_MIME_TYPES[mimeType];
    const cleanBasename = filename ?
    path.basename(filename).replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase() :
    'replaced';
    const uniqueFilename = `img_rep_${Date.now()}_${cleanBasename}.${ext}`;
    const filePath = path.join(uploadsDir, uniqueFilename);

    try {
      fs.writeFileSync(filePath, buffer);
    } catch (err) {
      console.error('Failed to write replacement file:', err);
      res.status(500).json({ error: 'Failed to write replacement image.' });
      return;
    }

    const newUrl = `/uploads/${uniqueFilename}`;
    const parsedWidth = typeof width === 'number' && width > 0 ? width : existing.width;
    const parsedHeight = typeof height === 'number' && height > 0 ? height : existing.height;

    
    const updated = db.replaceMediaFile(id, {
      url: newUrl,
      filename: uniqueFilename,
      width: parsedWidth,
      height: parsedHeight,
      fileSize: buffer.length,
      formattedSize: formatBytes(buffer.length),
      mimeType
    });

    const replacedEverywhereCount = replaceEverywhere !== false ?
    db.replaceMediaEverywhere(existing.url, newUrl, existing.id) :
    0;

    res.json({
      success: true,
      message: `Image replaced successfully. Updated across ${replacedEverywhereCount} website locations.`,
      media: updated,
      updatedLocationsCount: replacedEverywhereCount
    });
  },

  
  delete(req, res) {
    const { id } = req.params;
    const { force } = req.query;

    const result = db.deleteMedia(id, force === 'true');

    if (!result.success && result.inUse) {
      res.status(409).json({
        error: result.message,
        inUse: true,
        locations: result.locations
      });
      return;
    }

    if (!result.success) {
      res.status(404).json({ error: result.message });
      return;
    }

    res.json({ success: true, message: result.message });
  }
};
