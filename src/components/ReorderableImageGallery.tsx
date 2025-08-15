import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { X, GripVertical } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';

interface SortableImageItemProps {
  id: string;
  url: string;
  index: number;
  onRemove: (index: number) => void;
}

const SortableImageItem: React.FC<SortableImageItemProps> = ({
  id,
  url,
  index,
  onRemove,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group bg-card border rounded-lg overflow-hidden ${
        isDragging ? 'shadow-lg ring-2 ring-primary' : ''
      }`}
    >
      <div className="aspect-video">
        <OptimizedImage
          src={url}
          alt={`Property image ${index + 1}`}
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <div className="bg-black/50 p-1 rounded">
          <GripVertical className="h-4 w-4 text-white" />
        </div>
      </div>

      {/* Remove button */}
      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onRemove(index)}
      >
        <X className="h-3 w-3" />
      </Button>

      {/* Image order indicator */}
      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
        {index + 1}
      </div>
    </div>
  );
};

interface ReorderableImageGalleryProps {
  images: string[];
  onImagesReorder: (newImages: string[]) => void;
  onImageRemove: (index: number) => void;
  title?: string;
}

export const ReorderableImageGallery: React.FC<ReorderableImageGalleryProps> = ({
  images,
  onImagesReorder,
  onImageRemove,
  title = "Fotos da Propriedade",
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = images.findIndex((url) => `image-${url}` === active.id);
      const newIndex = images.findIndex((url) => `image-${url}` === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newImages = arrayMove(images, oldIndex, newIndex);
        console.log('Reordering images:', { oldIndex, newIndex, newImages });
        onImagesReorder(newImages);
      }
    }
  };

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <span className="text-sm text-muted-foreground">
          {images.length} foto{images.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Arraste as imagens para reorganizar a ordem. A primeira imagem será a foto principal.
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={images.map((url) => `image-${url}`)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((url, index) => (
              <SortableImageItem
                key={url}
                id={`image-${url}`}
                url={url}
                index={index}
                onRemove={onImageRemove}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};