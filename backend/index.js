const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 4000;

// enable CORS for frontend (allow configurable origin via CORS_ORIGIN env var)
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());

// In-memory array of images for demo purposes
let images = [];

app.get('/api/images', (req, res) => {
  res.json(images);
});

// Setup multer for file uploads (stores files to backend/uploads)
const uploadDir = path.join(__dirname, 'uploads');
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

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const title = req.body.title || 'Untitled';
  const imageUrl = '/uploads/' + req.file.filename;
  const item = { id: images.length ? images[images.length - 1].id + 1 : 1, title, imageUrl };
  images.push(item);
  res.json(item);
});

// delete an image by id (remove metadata and the file on disk)
app.delete('/api/images/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = images.findIndex((it) => it.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  const item = images[idx];
  // try to delete the file if it exists
  try {
    const filename = item.imageUrl ? path.basename(item.imageUrl) : null;
    if (filename) {
      const full = path.join(uploadDir, filename);
      if (fs.existsSync(full)) {
        fs.unlinkSync(full);
      }
    }
  } catch (err) {
    console.error('Failed to delete file for image', err);
    // continue to remove metadata even if file deletion fails
  }

  images.splice(idx, 1);
  res.json({ success: true });
});

// update an image's title by id
app.put('/api/images/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { title } = req.body;
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'Title is required and must be a string' });
  }

  const item = images.find((it) => it.id === id);
  if (!item) return res.status(404).json({ error: 'Not found' });

  item.title = title.trim();
  res.json(item);
});

// Serve uploaded files statically
app.use('/uploads', express.static(uploadDir));

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
