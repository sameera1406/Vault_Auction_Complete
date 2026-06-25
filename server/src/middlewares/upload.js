const multer = require('multer');
const path = require('path');

// Configure disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    // Generate a unique filename using timestamp and a random suffix
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    // Keep original file extension
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// File filter to allow only specific formats
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, JPEG, PNG, and WEBP formats are supported.'), false);
  }
};

// Configure limits
const limits = {
  fileSize: 5 * 1024 * 1024, // 5 MB per file
};

const upload = multer({
  storage,
  fileFilter,
  limits
});

module.exports = upload;
