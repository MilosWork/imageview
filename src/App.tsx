import React, { useState, useEffect } from "react";
import "./App.css";
import Header from "./components/Header";
import ImageCard from "./components/ImageCard";
import cardImage from "./image/3.jpg";

type Card = {
  id: number;
  imageUrl: string;
  title: string;
  buttonText: string;
};

function App() {
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

  // load images from backend on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoadingImages(true);
      setLoadError(null);
      try {
        const res = await fetch(`${API_BASE}/api/images`);
        if (!res.ok) throw new Error(`Failed to load images (${res.status})`);
        const data = await res.json();
        if (cancelled) return;
        // map backend items to Card; backend may return imageUrl like '/uploads/xxx'
        const mapped: Card[] = (data || []).map((it: any) => {
          let url = it.imageUrl || '';
          if (url && url.startsWith('/')) {
            // make absolute to backend
            url = API_BASE.replace(/\/$/, '') + url;
          }
          return {
            id: it.id,
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
    }

    load();
    return () => { cancelled = true; };
  }, [API_BASE]);

  useEffect(() => {
    // create/revoke preview URL when file changes
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => {
      URL.revokeObjectURL(url);
      setPreview("");
    };
  }, [file]);

  const openAddDialog = () => {
    setIsAddOpen(true);
  };

  function closeAddDialog() {
    setIsAddOpen(false);
    if (preview) {
      try {
        URL.revokeObjectURL(preview);
      } catch {}
    }
    setFile(null);
    setPreview("");
    setNewTitle("");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files && e.target.files[0];
    setFile(f || null);
  }

  async function handleAdd() {
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

      // backend should return { id, title, imageUrl }
      let returnedUrl = item.imageUrl || preview || '';
      if (returnedUrl && returnedUrl.startsWith('/')) {
        returnedUrl = API_BASE.replace(/\/$/, '') + returnedUrl;
      }

      const nextCard: Card = {
        id: item.id ?? (cards.length ? Math.max(...cards.map((c) => c.id)) + 1 : 1),
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
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Delete this image?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/images/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      setCards((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      console.error('Delete error', err);
      alert(err?.message || 'Delete failed');
    }
  }

  function openEditDialog(card: Card) {
    setEditingCard(card);
    setEditTitle(card.title);
    setIsEditOpen(true);
    setUpdateError(null);
  }

  function closeEditDialog() {
    setIsEditOpen(false);
    setEditingCard(null);
    setEditTitle("");
    setUpdateError(null);
  }

  async function handleUpdateTitle() {
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

      // update the card in the grid
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
  }

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
              <button
                className="modal-button modal-cancel"
                onClick={closeAddDialog}
              >
                Cancel
              </button>
              <button
                className="modal-button modal-save"
                onClick={handleAdd}
                disabled={isUploading}
              >
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
              <button
                className="modal-button modal-cancel"
                onClick={closeEditDialog}
              >
                Cancel
              </button>
              <button
                className="modal-button modal-save"
                onClick={handleUpdateTitle}
                disabled={isUpdating}
              >
                {isUpdating ? 'Saving...' : 'Save'}
              </button>
            </div>
            {updateError && <div style={{ color: 'crimson', marginTop: 8 }}>{updateError}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
