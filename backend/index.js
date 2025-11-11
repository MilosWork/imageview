const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cors = require('cors');

const connectDB = require('./config/db');
const imageRoutes = require('./routes/images');

const app = express();
const port = process.env.PORT || 4000;

// enable CORS for frontend (allow configurable origin via CORS_ORIGIN env var)
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());

// Connect to MongoDB
connectDB();

// Setup multer for file uploads (stores files to backend/uploads)
const uploadDir = path.join(__dirname, 'uploads');
try {
  fs.mkdirSync(uploadDir, { recursive: true });
} catch (err) {
  console.error('Failed to create upload dir', err);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Routes
app.get('/api/images', imageRoutes.getAllImages);
app.post('/api/upload', upload.single('image'), imageRoutes.uploadImage);
app.put('/api/images/:id', imageRoutes.updateImage);
app.delete('/api/images/:id', imageRoutes.deleteImage);

// Serve uploaded files statically
app.use('/uploads', express.static(uploadDir));

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
