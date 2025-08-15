import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { X, Upload, Image as ImageIcon } from 'lucide-react'
import { useImageOptimization, type OptimizationResult } from '@/hooks/useImageOptimization'
import { toast } from '@/hooks/use-toast'
import { OptimizedImage } from '@/components/ui/optimized-image'

interface ImageUploadOptimizedProps {
  onImagesChange: (urls: string[]) => void
  maxImages?: number
  bucket?: string
  path?: string
  existingImages?: string[]
  disabled?: boolean
}

export const ImageUploadOptimized: React.FC<ImageUploadOptimizedProps> = ({
  onImagesChange,
  maxImages = 10,
  bucket = 'property-images',
  path = 'properties',
  existingImages = [],
  disabled = false
}) => {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [optimizedImages, setOptimizedImages] = useState<string[]>(existingImages)
  const [uploadStats, setUploadStats] = useState<{
    totalSaved: number
    compressionRatio: number
  } | null>(null)

  const { optimizeAndUpload } = useImageOptimization()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    if (files.length === 0) return
    
    if (optimizedImages.length + files.length > maxImages) {
      toast({
        title: 'Limite excedido',
        description: `Máximo de ${maxImages} imagens permitidas.`,
        variant: 'destructive',
      })
      return
    }

    // Validar tipos de arquivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const invalidFiles = files.filter(file => !validTypes.includes(file.type))
    
    if (invalidFiles.length > 0) {
      toast({
        title: 'Formato inválido',
        description: 'Apenas arquivos JPG, PNG e WebP são permitidos.',
        variant: 'destructive',
      })
      return
    }

    // Validar tamanho dos arquivos (máximo 10MB por arquivo)
    const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      toast({
        title: 'Arquivo muito grande',
        description: 'Tamanho máximo de 10MB por imagem.',
        variant: 'destructive',
      })
      return
    }

    setUploading(true)
    setUploadProgress(0)
    
    try {
      const newImages: string[] = []
      let totalOriginalSize = 0
      let totalOptimizedSize = 0
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        setUploadProgress(((i + 1) / files.length) * 90)
        
        const result: OptimizationResult = await optimizeAndUpload({
          file,
          bucket,
          path,
          onProgress: (progress) => {
            const fileProgress = (i / files.length) * 90 + (progress / files.length) * 0.9
            setUploadProgress(fileProgress)
          }
        })

        newImages.push(result.urls.optimized)
        totalOriginalSize += result.originalSize
        totalOptimizedSize += result.optimizedSize
      }

      const finalImages = [...optimizedImages, ...newImages]
      setOptimizedImages(finalImages)
      onImagesChange(finalImages)

      const totalSaved = totalOriginalSize - totalOptimizedSize
      const compressionRatio = (totalSaved / totalOriginalSize) * 100

      setUploadStats({
        totalSaved,
        compressionRatio
      })

      setUploadProgress(100)

      toast({
        title: 'Upload concluído!',
        description: `${files.length} ${files.length === 1 ? 'imagem otimizada' : 'imagens otimizadas'} com ${compressionRatio.toFixed(1)}% de compressão.`,
      })

    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Erro no upload',
        description: 'Falha ao fazer upload das imagens. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
      setUploadProgress(0)
      // Reset input
      e.target.value = ''
    }
  }

  const removeImage = (index: number) => {
    const newImages = optimizedImages.filter((_, i) => i !== index)
    setOptimizedImages(newImages)
    onImagesChange(newImages)
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="images" className="text-base font-medium">
          Imagens da Propriedade
        </Label>
        <p className="text-sm text-muted-foreground mt-1">
          Adicione até {maxImages} imagens. Elas serão otimizadas automaticamente para carregamento rápido.
        </p>
      </div>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
        <Input
          id="images"
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          disabled={disabled || uploading}
          className="hidden"
        />
        
        <Label 
          htmlFor="images" 
          className={`cursor-pointer flex flex-col items-center gap-2 ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            {uploading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            ) : (
              <Upload className="w-6 h-6 text-primary" />
            )}
          </div>
          
          <div>
            <p className="text-sm font-medium">
              {uploading ? 'Otimizando imagens...' : 'Clique para adicionar imagens'}
            </p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG ou WebP até 10MB cada
            </p>
          </div>
        </Label>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Otimizando imagens...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* Upload Stats */}
      {uploadStats && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-green-800 text-sm">
            <ImageIcon className="w-4 h-4" />
            <span>
              Economizou {(uploadStats.totalSaved / 1024).toFixed(0)}KB 
              ({uploadStats.compressionRatio.toFixed(1)}% de compressão)
            </span>
          </div>
        </div>
      )}

      {/* Image Preview Grid */}
      {optimizedImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {optimizedImages.map((imageUrl, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border">
                <OptimizedImage
                  src={imageUrl}
                  alt={`Imagem ${index + 1}`}
                  className="w-full h-full"
                />
              </div>
              
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
                disabled={disabled || uploading}
              >
                <X className="w-3 h-3" />
              </Button>
              
              <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 py-0.5 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {optimizedImages.length} de {maxImages} imagens
      </p>
    </div>
  )
}