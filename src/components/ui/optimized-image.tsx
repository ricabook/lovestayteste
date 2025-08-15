import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  thumbnailSrc?: string
  width?: number
  height?: number
  priority?: boolean
  onLoad?: () => void
  onError?: () => void
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className,
  thumbnailSrc,
  width,
  height,
  priority = false,
  onLoad,
  onError
}) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [imageSrc, setImageSrc] = useState(thumbnailSrc || src)

  useEffect(() => {
    if (!priority && !thumbnailSrc) return

    const img = new Image()
    img.onload = () => {
      setImageSrc(src)
      setImageLoaded(true)
      onLoad?.()
    }
    img.onerror = () => {
      setImageError(true)
      onError?.()
    }
    img.src = src
  }, [src, priority, thumbnailSrc, onLoad, onError])

  const handleImageLoad = () => {
    if (!thumbnailSrc) {
      setImageLoaded(true)
      onLoad?.()
    }
  }

  const handleImageError = () => {
    setImageError(true)
    onError?.()
  }

  if (imageError) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-muted text-muted-foreground",
        className
      )}>
        <div className="text-center">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs">Erro ao carregar</span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <img
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={cn(
          "w-full h-full object-cover transition-all duration-300",
          thumbnailSrc && !imageLoaded && "blur-sm scale-105",
          imageLoaded && "blur-0 scale-100"
        )}
      />
      
      {thumbnailSrc && !imageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  )
}

interface ImagePlaceholderProps {
  width?: number
  height?: number
  className?: string
  text?: string
}

export const ImagePlaceholder: React.FC<ImagePlaceholderProps> = ({
  width,
  height,
  className,
  text = "Carregando..."
}) => {
  return (
    <div 
      className={cn(
        "flex items-center justify-center bg-muted animate-pulse",
        className
      )}
      style={{ width, height }}
    >
      <div className="text-center text-muted-foreground">
        <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-xs">{text}</span>
      </div>
    </div>
  )
}