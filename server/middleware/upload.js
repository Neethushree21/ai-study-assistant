const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Unique filename: timestamp + user id + original name
    const uniqueSuffix = `${Date.now()}-${req.user?.id || 'unknown'}`;
    const ext = path.extname(file.originalname);
    cb(null, `note-${uniqueSuffix}${ext}`);
  },
});

// File filter: only allow PDF and text files
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['application/pdf', 'text/plain'];
  const allowedExts = ['.pdf', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and .txt files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
});

module.exports = upload;
