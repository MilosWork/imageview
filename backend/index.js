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

// We'll persist image metadata to MongoDB using mongoose
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/imageview';

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error', err));

const imageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  imageUrl: { type: String, required: true },
  filename: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Image = mongoose.model('Image', imageSchema);

// GET all images
app.get('/api/images', async (req, res) => {
  try {
    const imgs = await Image.find().sort({ createdAt: 1 }).lean();
    // return items with id as string for frontend convenience
    const out = imgs.map((it) => ({ id: String(it._id), title: it.title, imageUrl: it.imageUrl }));
    res.json(out);
  } catch (err) {
    console.error('Failed to fetch images', err);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
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

app.post('/api/upload', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const title = req.body.title || 'Untitled';
  const imageUrl = '/uploads/' + req.file.filename;
  try {
    const created = await Image.create({ title, imageUrl, filename: req.file.filename });
    res.json({ id: String(created._id), title: created.title, imageUrl: created.imageUrl });
  } catch (err) {
    console.error('Failed to save image metadata', err);
    res.status(500).json({ error: 'Failed to save metadata' });
  }
});

// delete an image by id (remove metadata and the file on disk)
// delete an image by id (remove metadata and the file on disk)
app.delete('/api/images/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const item = await Image.findById(id).lean();
    if (!item) return res.status(404).json({ error: 'Not found' });

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
    }

    await Image.deleteOne({ _id: id });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete error', err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// update an image's title by id
// update an image's title by id
app.put('/api/images/:id', async (req, res) => {
  const id = req.params.id;
  const { title } = req.body;
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'Title is required and must be a string' });
  }
  try {
    const updated = await Image.findByIdAndUpdate(id, { title: title.trim() }, { new: true }).lean();
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json({ id: String(updated._id), title: updated.title, imageUrl: updated.imageUrl });
  } catch (err) {
    console.error('Update error', err);
    res.status(500).json({ error: 'Update failed' });
  }
});

// Serve uploaded files statically
app.use('/uploads', express.static(uploadDir));

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
