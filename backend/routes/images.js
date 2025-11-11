const path = require('path');
const fs = require('fs');
const Image = require('../models/Image');

const uploadDir = path.join(__dirname, '..', 'uploads');

// GET /api/images - fetch all images
exports.getAllImages = async (req, res) => {
  try {
    const imgs = await Image.find().sort({ createdAt: 1 }).lean();
    const out = imgs.map((it) => ({ id: String(it._id), title: it.title, imageUrl: it.imageUrl }));
    res.json(out);
  } catch (err) {
    console.error('Failed to fetch images', err);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
};

// POST /api/upload - upload a new image
exports.uploadImage = async (req, res) => {
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
};

// PUT /api/images/:id - update image title
exports.updateImage = async (req, res) => {
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
};

// DELETE /api/images/:id - delete image
exports.deleteImage = async (req, res) => {
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
};
