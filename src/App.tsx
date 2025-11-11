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
  const [cards, setCards] = useState<Card[]>([
    { id: 1, imageUrl: cardImage, title: "Card 1", buttonText: "Edit" },
    { id: 2, imageUrl: cardImage, title: "Card 2", buttonText: "Edit" },
    { id: 3, imageUrl: cardImage, title: "Card 3", buttonText: "Edit" },
    { id: 4, imageUrl: cardImage, title: "Card 4", buttonText: "Edit" },
  ]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000';

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
      const nextCard: Card = {
        id: item.id ?? (cards.length ? Math.max(...cards.map((c) => c.id)) + 1 : 1),
        title: item.title || newTitle || 'Untitled',
        imageUrl: item.imageUrl || preview || '',
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

  return (
    <div className="App">
      <Header onAdd={openAddDialog} />
      <main className="app-body">
        <div className="cards-container">
          {cards.map((card) => (
            <ImageCard
              key={card.id}
              imageUrl={card.imageUrl}
              title={card.title}
              buttonText={card.buttonText}
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
    </div>
  );
}

export default App;
