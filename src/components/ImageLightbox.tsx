import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';

interface ImageLightboxProps {
  images: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  propertyTitle?: string;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  images,
  initialIndex,
  isOpen,
  onClose,
  propertyTitle = "Propriedade",
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Reset current index when initial index changes
  useEffect(() => {
    if (isOpen) {
      console.log('Lightbox opened with initial index:', initialIndex);
      setCurrentIndex(initialIndex);
    }
  }, [initialIndex, isOpen]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prevIndex) => {
      const newIndex = prevIndex === 0 ? images.length - 1 : prevIndex - 1;
      console.log('Going to previous:', { prevIndex, newIndex });
      return newIndex;
    });
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) => {
      const newIndex = prevIndex === images.length - 1 ? 0 : prevIndex + 1;
      console.log('Going to next:', { prevIndex, newIndex });
      return newIndex;
    });
  }, [images.length]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          event.preventDefault();
          goToNext();
          break;
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, goToPrevious, goToNext, onClose]);

  if (images.length === 0) return null;

  const currentImage = images[currentIndex];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-full h-[90vh] p-0 bg-black/95 border-0">
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Image counter */}
          <div className="absolute top-4 left-4 z-50 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
            {currentIndex + 1} / {images.length}
          </div>

          {/* Previous button */}
          {images.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 h-12 w-12 bg-black/30"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
          )}

          {/* Next button */}
          {images.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 h-12 w-12 bg-black/30"
              onClick={goToNext}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          )}

          {/* Main image container with proper sizing */}
          <div className="w-full h-full flex items-center justify-center p-16">
            <div className="relative max-w-full max-h-full">
              {currentImage && (
                <img
                  key={currentIndex} // Force re-render when index changes
                  src={currentImage}
                  alt={`${propertyTitle} - Foto ${currentIndex + 1}`}
                  className="max-w-full max-h-full w-auto h-auto object-contain"
                  style={{
                    maxHeight: 'calc(90vh - 8rem)',
                    maxWidth: 'calc(100vw - 8rem)',
                  }}
                  onLoad={() => console.log('Image loaded:', currentIndex, currentImage)}
                />
              )}
            </div>
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50">
              <div className="flex space-x-2 bg-black/70 p-3 rounded-lg max-w-[80vw] overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      console.log('Thumbnail clicked:', index);
                      setCurrentIndex(index);
                    }}
                    className={`flex-shrink-0 relative transition-all ${
                      index === currentIndex
                        ? 'ring-2 ring-white scale-110'
                        : 'opacity-70 hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Miniatura ${index + 1}`}
                      className="w-16 h-12 object-cover rounded"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Property title */}
          <div className="absolute bottom-24 left-4 z-50 text-white">
            <h3 className="text-lg font-semibold drop-shadow-lg">{propertyTitle}</h3>
            <p className="text-sm text-white/80 drop-shadow-lg">
              Foto {currentIndex + 1} de {images.length}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};