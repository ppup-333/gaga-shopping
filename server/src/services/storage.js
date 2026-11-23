const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

// 配置 Cloudinary (若有環境變數則自動啟用)
const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// 記憶體儲存 (適合直接串接 Cloudinary 或轉為 Base64 / 本地快取)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 限制 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('僅支援上傳圖片檔案 (JPG, PNG, WebP)'));
    }
  }
});

// 上傳圖片處理函式
const uploadImage = async (fileBuffer, mimetype) => {
  if (isCloudinaryConfigured) {
    // 透過 Cloudinary 上傳（永久保存，不怕 Render 重啟）
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'gaga-inventory',
          transformation: [{ width: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }]
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        }
      );
      uploadStream.end(fileBuffer);
    });
  } else {
    // 開發階段或未配置 Cloudinary 時的本機/Base64 回退機制
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const ext = mimetype.split('/')[1] || 'jpg';
    const filename = `item-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, fileBuffer);
    return `/uploads/${filename}`;
  }
};

module.exports = {
  upload,
  uploadImage,
  isCloudinaryConfigured
};
