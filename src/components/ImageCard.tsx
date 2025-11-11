import React from 'react';
import './ImageCard.css';

interface ImageCardProps {
  imageUrl: string;
  title: string;
  buttonText: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

function ImageCard({ imageUrl, title, buttonText, onEdit, onDelete }: ImageCardProps) {
  return (
    <div className="image-card">
      <img src={imageUrl} alt={title} className="card-image" />
      <h3 className="card-title">{title}</h3>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="card-button" onClick={onEdit}>{buttonText}</button>
        <button className="card-button card-delete" onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
}

export default ImageCard;
