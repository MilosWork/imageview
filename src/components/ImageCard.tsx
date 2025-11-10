import React from 'react';
import './ImageCard.css';

interface ImageCardProps {
  imageUrl: string;
  title: string;
  buttonText: string;
}

function ImageCard({ imageUrl, title, buttonText }: ImageCardProps) {
  return (
    <div className="image-card">
      <img src={imageUrl} alt={title} className="card-image" />
      <h3 className="card-title">{title}</h3>
      <button className="card-button">{buttonText}</button>
    </div>
  );
}

export default ImageCard;
