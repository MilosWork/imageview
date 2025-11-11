import React, { useState, useEffect, useCallback } from "react";
import "./App.css";
import Header from "./components/Header";
import ImageCard from "./components/ImageCard";

type Card = {
  id: string;
  imageUrl: string;
  title: string;
  buttonText: string;
};

const App = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000';

  // Load images from backend on mount
  useEffect(() => {
    let cancelled = false;

    const loadImages = async () => {
      setIsLoadingImages(true);
      setLoadError(null);
      try {
        const res = await fetch(`${API_BASE}/api/images`);
        if (!res.ok) throw new Error(`Failed to load images (${res.status})`);
        const data = await res.json();
        if (cancelled) return;

        const mapped: Card[] = (data || []).map((it: any) => {
          let url = it.imageUrl || '';
          if (url && url.startsWith('/')) {
            url = `${API_BASE.replace(/\/$/, '')}${url}`;
          }
          return {
            id: String(it.id),
            title: it.title || 'Untitled',
            imageUrl: url,
            buttonText: 'Edit',
          };
        });

        setCards(mapped);
      } catch (err: any) {
        console.error('Failed to load images', err);
        setLoadError(err?.message || 'Failed to load images');
      } finally {
        setIsLoadingImages(false);
      }
    };

    loadImages();
    return () => { cancelled = true; };
  }, [API_BASE]);

  // Create/revoke preview URL when file changes
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => {
      URL.revokeObjectURL(url);
      setPreview("");
    };
  }, [file]);

  const openAddDialog = () => setIsAddOpen(true);

  const closeAddDialog = () => {
    setIsAddOpen(false);
    if (preview) {
      try {
        URL.revokeObjectURL(preview);
      } catch {}
    }
    setFile(null);
    setPreview("");
    setNewTitle("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    setFile(f || null);
  };

  const handleAdd = async () => {
    setUploadError(null);
    if (!file) {
      setUploadError('Please choose an image to upload.');
      return;
    }

    setIsUploading(true);

    try {
      const form = new FormData();
      form.append('image', file);
      form.append('title', newTitle.trim() || 'Untitled');

      const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body && body.error ? body.error : `Upload failed (${res.status})`);
      }

      const item = await res.json();

      let returnedUrl = item.imageUrl || preview || '';
      if (returnedUrl && returnedUrl.startsWith('/')) {
        returnedUrl = `${API_BASE.replace(/\/$/, '')}${returnedUrl}`;
      }

      const nextCard: Card = {
        id: String(item.id),
        title: item.title || newTitle || 'Untitled',
        imageUrl: returnedUrl,
        buttonText: 'Edit',
      };

      setCards((prev) => [...prev, nextCard]);
      closeAddDialog();
    } catch (err: any) {
      console.error('Upload error', err);
      setUploadError(err?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = useCallback(async (id: string) => {
    if (!window.confirm('Delete this image?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/images/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      setCards((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      console.error('Delete error', err);
      alert(err?.message || 'Delete failed');
    }
  }, [API_BASE]);

  const openEditDialog = (card: Card) => {
    setEditingCard(card);
    setEditTitle(card.title);
    setIsEditOpen(true);
    setUpdateError(null);
  };

  const closeEditDialog = () => {
    setIsEditOpen(false);
    setEditingCard(null);
    setEditTitle("");
    setUpdateError(null);
  };

  const handleUpdateTitle = async () => {
    setUpdateError(null);
    if (!editingCard) return;
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) {
      setUpdateError("Title cannot be empty");
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch(`${API_BASE}/api/images/${editingCard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmedTitle }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body && body.error ? body.error : `Update failed (${res.status})`);
      }

      setCards((prev) =>
        prev.map((c) => (c.id === editingCard.id ? { ...c, title: trimmedTitle } : c))
      );
      closeEditDialog();
    } catch (err: any) {
      console.error('Update error', err);
      setUpdateError(err?.message || 'Update failed');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="App">
      <Header onAdd={openAddDialog} />
      <main className="app-body">
        {isLoadingImages && <div style={{ textAlign: 'center', marginBottom: 12 }}>Loading images...</div>}
        {loadError && <div style={{ color: 'crimson', textAlign: 'center', marginBottom: 12 }}>{loadError}</div>}
        <div className="cards-container">
          {cards.map((card) => (
            <ImageCard
              key={card.id}
              imageUrl={card.imageUrl}
              title={card.title}
              buttonText={card.buttonText}
              onEdit={() => openEditDialog(card)}
              onDelete={() => handleDelete(card.id)}
            />
          ))}
        </div>
      </main>

      {isAddOpen && (
        <div className="modal-overlay" onClick={closeAddDialog}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Image</h3>

            <label className="modal-label">Choose image file</label>
            <input type="file" accept="image/*" onChange={handleFileChange} />

            {preview && (
              <img src={preview} alt="preview" className="modal-image" />
            )}

            <label className="modal-label">Title</label>
            <input
              className="modal-input"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter image title"
            />

            <div className="modal-actions">
              <button className="modal-button modal-cancel" onClick={closeAddDialog}>Cancel</button>
              <button className="modal-button modal-save" onClick={handleAdd} disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Save'}
              </button>
            </div>
            {uploadError && <div style={{ color: 'crimson', marginTop: 8 }}>{uploadError}</div>}
          </div>
        </div>
      )}

      {isEditOpen && editingCard && (
        <div className="modal-overlay" onClick={closeEditDialog}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Image Title</h3>

            <img src={editingCard.imageUrl} alt={editingCard.title} className="modal-image" />

            <label className="modal-label">Title</label>
            <input
              className="modal-input"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Enter new title"
            />

            <div className="modal-actions">
              <button className="modal-button modal-cancel" onClick={closeEditDialog}>Cancel</button>
              <button className="modal-button modal-save" onClick={handleUpdateTitle} disabled={isUpdating}>
                {isUpdating ? 'Saving...' : 'Save'}
              </button>
            </div>
            {updateError && <div style={{ color: 'crimson', marginTop: 8 }}>{updateError}</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
