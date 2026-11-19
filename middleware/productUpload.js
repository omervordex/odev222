const multer = require('multer');
const productImages = require('./productImages');

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

const useSupabaseStorage = productImages.storageMode() === 'supabase';

if (!useSupabaseStorage) {
  productImages.ensureUploadDir();
}

const upload = multer({
  storage: useSupabaseStorage
    ? multer.memoryStorage()
    : multer.diskStorage({
      destination(req, file, callback) {
        callback(null, productImages.UPLOAD_DIR);
      },
      filename(req, file, callback) {
        callback(null, productImages.temporaryName());
      }
    }),
  limits: {
    files: 1,
    fileSize: MAX_BYTES
  },
  fileFilter(req, file, callback) {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      const error = new Error('Yalnızca JPG, PNG veya WEBP yükleyebilirsiniz.');
      error.code = 'UNSUPPORTED_TYPE';
      callback(error);
      return;
    }

    callback(null, true);
  }
});

function uploadErrorMessage(error) {
  if (!error) {
    return '';
  }

  if (error.code === 'LIMIT_FILE_SIZE') {
    return 'Görsel 5 MB sınırını aşıyor.';
  }

  if (error.code === 'UNSUPPORTED_TYPE') {
    return 'Yalnızca JPG, PNG veya WEBP yükleyebilirsiniz.';
  }

  return 'Görsel yüklenemedi. Lütfen yeniden deneyin.';
}

function uploadProductImage(req, res, next) {
  upload.single('image_file')(req, res, async (error) => {
    if (error) {
      req.imageUploadError = uploadErrorMessage(error);
      if (req.file) {
        await productImages.discardFile(req.file.path).catch(() => {});
        req.file = undefined;
      }
      next();
      return;
    }

    if (!req.file) {
      next();
      return;
    }

    try {
      const publicPath = await productImages.finalizeUpload(req.file);
      if (!publicPath) {
        req.file = undefined;
        req.imageUploadError = 'Dosya içeriği JPG, PNG veya WEBP değil.';
      } else {
        req.uploadedImagePath = publicPath;
      }
      next();
    } catch (uploadError) {
      await productImages.discardFile(req.file && req.file.path).catch(() => {});
      req.file = undefined;
      next(uploadError);
    }
  });
}

function preferUploadedFile(req, res, next) {
  if (req.uploadedImagePath) {
    req.body.image_url = '';
    req.body.remove_image = '';
  } else if (req.imageUploadError) {
    req.body.remove_image = '';
  } else if (req.body.remove_image === '1') {
    req.body.image_url = '';
  }

  next();
}

module.exports = {
  MAX_BYTES,
  uploadProductImage,
  preferUploadedFile
};
