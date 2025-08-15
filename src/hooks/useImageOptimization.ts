import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'

export interface OptimizationResult {
  success: boolean
  originalSize: number
  optimizedSize: number
  thumbnailSize: number
  compressionRatio: number
  urls: {
    optimized: string
    thumbnail: string
    original: string
  }
}

export interface ImageUploadOptions {
  file: File
  bucket: string
  path: string
  onProgress?: (progress: number) => void
}

export const useImageOptimization = () => {
  const optimizeAndUpload = async (options: ImageUploadOptions): Promise<OptimizationResult> => {
    const { file, bucket, path, onProgress } = options

    try {
      onProgress?.(10)

      // 1. Upload da imagem original
      const fileExt = file.name.split('.').pop()
      const fileName = `${crypto.randomUUID()}.${fileExt}`
      const filePath = `${path}/${fileName}`

      onProgress?.(30)

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file)

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      onProgress?.(50)

      // 2. Obter URL da imagem original
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      onProgress?.(60)

      // 3. Chamar função de otimização
      const { data, error } = await supabase.functions.invoke('optimize-image', {
        body: {
          imageUrl: publicUrl,
          fileName: fileName,
          bucket: bucket,
          path: path
        }
      })

      if (error) {
        throw new Error(`Optimization failed: ${error.message}`)
      }

      onProgress?.(90)

      // 4. Remover imagem original (opcional, manter se necessário)
      // await supabase.storage.from(bucket).remove([filePath])

      onProgress?.(100)

      return data as OptimizationResult

    } catch (error) {
      console.error('Image optimization error:', error)
      toast({
        title: 'Erro na otimização',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
      throw error
    }
  }

  const optimizeExistingImages = async (
    imageUrls: string[],
    bucket: string,
    path: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<OptimizationResult[]> => {
    const results: OptimizationResult[] = []

    for (let i = 0; i < imageUrls.length; i++) {
      try {
        const imageUrl = imageUrls[i]
        const fileName = imageUrl.split('/').pop() || `image_${i}.jpg`
        
        onProgress?.(i + 1, imageUrls.length)

        const { data, error } = await supabase.functions.invoke('optimize-image', {
          body: {
            imageUrl,
            fileName,
            bucket,
            path
          }
        })

        if (error) {
          console.error(`Failed to optimize image ${i + 1}:`, error)
          continue
        }

        results.push(data as OptimizationResult)
      } catch (error) {
        console.error(`Error optimizing image ${i + 1}:`, error)
      }
    }

    return results
  }

  return {
    optimizeAndUpload,
    optimizeExistingImages
  }
}