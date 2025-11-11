/**
 * Shared TypeScript types for the frontend (src/)
 * Keep backend types separate in the backend folder.
 */

export type Card = {
  id: string; // MongoDB _id as string
  imageUrl: string;
  title: string;
  buttonText: string;
};

export interface ImageCardProps {
  imageUrl: string;
  title: string;
  buttonText: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export interface HeaderProps {
  onAdd?: () => void;
}

export interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderColor?: string;
}

// Shape returned by the backend API for images
export interface BackendImage {
  id: string;
  title: string;
  imageUrl: string;
}
