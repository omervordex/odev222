const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const productModel = require('../models/productModel');
const supabase = require('../config/supabase');

const UPLOAD_DIR = path.resolve(__dirname, '../public/uploads/products');
const PUBLIC_PREFIX = '/uploads/products/';
const STORED_NAME = /^([a-f0-9]{32})\.(jpe?g|png|webp)$/;
const MANAGED_PATH = /^\/uploads\/products\/[a-f0-9]{32}\.(?:jpe?g|png|webp)$/;

const STORAGE_BUCKET = (process.env.SUPABASE_STORAGE_BUCKET || 'product-images').trim() || 'product-images';
let bucketReady = null;

function storageMode() {
  const setting = (process.env.UPLOAD_STORAGE || 'auto').trim().toLowerCase();

  if (setting === 'supabase' || setting === 'local') {
    return setting;
  }

  if (process.env.NETLIFY === 'true' || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return 'supabase';
  }

  return 'local';
}

const SIGNATURES = {
  jpg: {
    mime: 'image/jpeg',
    matches(buffer) {
      return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    }
  },
  png: {
    mime: 'image/png',
    matches(buffer) {
      return buffer.length >= 8
        && buffer[0] === 0x89
        && buffer[1] === 0x50
        && buffer[2] === 0x4e
        && buffer[3] === 0x47
        && buffer[4] === 0x0d
        && buffer[5] === 0x0a
        && buffer[6] === 0x1a
        && buffer[7] === 0x0a;
    }
  },
  webp: {
    mime: 'image/webp',
    matches(buffer) {
      return buffer.length >= 12
        && buffer.toString('ascii', 0, 4) === 'RIFF'
        && buffer.toString('ascii', 8, 12) === 'WEBP';
    }
  }
};

function ensureUploadDir() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function temporaryName() {
  return `${crypto.randomBytes(16).toString('hex')}.tmp`;
}

function detectType(buffer) {
  return Object.keys(SIGNATURES).find((type) => SIGNATURES[type].matches(buffer)) || '';
}

function managedPublicPath(filename) {
  if (!STORED_NAME.test(filename || '')) {
    return '';
  }

  return `${PUBLIC_PREFIX}${filename}`;
}

function localFileFromPublicPath(publicPath) {
  if (!MANAGED_PATH.test(publicPath || '')) {
    return '';
  }

  const filename = path.basename(publicPath);
  if (!STORED_NAME.test(filename)) {
    return '';
  }

  const full = path.resolve(UPLOAD_DIR, filename);
  const relative = path.relative(UPLOAD_DIR, full);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    return '';
  }

  return full;
}

function storageObjectName(value) {
  if (!value || typeof value !== 'string' || !/^https?:\/\//i.test(value)) {
    return '';
  }

  let url;
  let expectedHost = '';

  try {
    url = new URL(value);
    expectedHost = new URL(process.env.SUPABASE_URL || '').host;
  } catch {
    return '';
  }

  if (!expectedHost || url.host !== expectedHost || url.username || url.password) {
    return '';
  }

  const prefix = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
  if (!url.pathname.startsWith(prefix)) {
    return '';
  }

  const name = decodeURIComponent(url.pathname.slice(prefix.length));
  return STORED_NAME.test(name) ? name : '';
}

async function ensureBucket() {
  if (bucketReady) {
    return bucketReady;
  }

  bucketReady = (async () => {
    const created = await supabase.storage.createBucket(STORAGE_BUCKET, { public: true });
    if (created.error && !/already exists/i.test(created.error.message || '')) {
      throw created.error;
    }

    const updated = await supabase.storage.updateBucket(STORAGE_BUCKET, { public: true });
    if (updated.error) {
      throw updated.error;
    }
  })().catch((error) => {
    bucketReady = null;
    throw error;
  });

  return bucketReady;
}

async function discardStoredObject(objectName) {
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([objectName]);
  if (error) {
    throw error;
  }
}

async function discardFile(filePath) {
  if (!filePath) {
    return;
  }

  const objectName = storageObjectName(filePath);
  if (objectName) {
    await discardStoredObject(objectName);
    return;
  }

  const managedLocal = localFileFromPublicPath(filePath);
  const resolved = path.resolve(managedLocal || filePath);
  const relative = path.relative(UPLOAD_DIR, resolved);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    return;
  }

  await fs.promises.unlink(resolved).catch((error) => {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  });
}

async function finalizeSupabaseUpload(file) {
  const buffer = file.buffer;
  if (!buffer || !buffer.length) {
    return '';
  }

  const type = detectType(buffer);
  const claimed = file.mimetype === 'image/jpg' ? 'image/jpeg' : file.mimetype;
  if (!type || SIGNATURES[type].mime !== claimed) {
    return '';
  }

  const extension = type === 'jpg' ? 'jpg' : type;
  const filename = `${crypto.randomBytes(16).toString('hex')}.${extension}`;

  await ensureBucket();
  const uploaded = await supabase.storage.from(STORAGE_BUCKET).upload(filename, buffer, {
    contentType: SIGNATURES[type].mime,
    upsert: false,
    cacheControl: '3600'
  });

  if (uploaded.error) {
    console.error('Product image upload failed');
    const error = new Error('Görsel kalıcı depoya kaydedilemedi.');
    error.status = 500;
    throw error;
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filename);
  file.filename = filename;
  return data && data.publicUrl ? data.publicUrl : '';
}

async function finalizeUpload(file) {
  if (storageMode() === 'supabase') {
    return finalizeSupabaseUpload(file);
  }

  return finalizeLocalUpload(file);
}

async function finalizeLocalUpload(file) {
  const temporaryPath = file.path;
  const handle = await fs.promises.open(temporaryPath, 'r');
  let header;

  try {
    const buffer = Buffer.alloc(16);
    const result = await handle.read(buffer, 0, 16, 0);
    header = buffer.subarray(0, result.bytesRead);
  } finally {
    await handle.close();
  }

  const type = detectType(header);
  const claimed = file.mimetype === 'image/jpg' ? 'image/jpeg' : file.mimetype;
  if (!type || SIGNATURES[type].mime !== claimed) {
    await discardFile(temporaryPath);
    return '';
  }

  const extension = type === 'jpg' ? 'jpg' : type;
  const filename = `${path.basename(temporaryPath, '.tmp')}.${extension}`;
  const finalPath = path.resolve(UPLOAD_DIR, filename);
  await fs.promises.rename(temporaryPath, finalPath);
  file.filename = filename;
  file.path = finalPath;
  return managedPublicPath(filename);
}

async function discardUpload(req) {
  if (!req) {
    return;
  }

  if (req.uploadedImagePath) {
    await discardFile(req.uploadedImagePath);
    req.uploadedImagePath = '';
    return;
  }

  if (req.file && req.file.path) {
    await discardFile(req.file.path);
  }
}

async function releaseReplacedImage(previousUrl, nextUrl) {
  if (!previousUrl || previousUrl === nextUrl) {
    return;
  }

  if (!MANAGED_PATH.test(previousUrl) && !storageObjectName(previousUrl)) {
    return;
  }

  const stillUsed = await productModel.imageUsedByOthers(previousUrl);
  if (stillUsed) {
    return;
  }

  await discardFile(previousUrl);
}

module.exports = {
  UPLOAD_DIR,
  ensureUploadDir,
  temporaryName,
  finalizeUpload,
  discardFile,
  discardUpload,
  releaseReplacedImage,
  managedPublicPath,
  storageMode
};
