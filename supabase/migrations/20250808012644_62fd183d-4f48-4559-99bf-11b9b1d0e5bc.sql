-- Criar tabela para armazenar metadados de otimização de imagens
CREATE TABLE IF NOT EXISTS public.image_optimizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_url TEXT NOT NULL,
  optimized_url TEXT NOT NULL,
  thumbnail_url TEXT,
  original_size INTEGER NOT NULL,
  optimized_size INTEGER NOT NULL,
  thumbnail_size INTEGER,
  compression_ratio DECIMAL(5,2) NOT NULL,
  mime_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.image_optimizations ENABLE ROW LEVEL SECURITY;

-- Políticas para otimizações de imagem
CREATE POLICY "Admins can view all image optimizations" 
ON public.image_optimizations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can insert image optimizations" 
ON public.image_optimizations 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_image_optimizations_updated_at
BEFORE UPDATE ON public.image_optimizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para obter estatísticas de otimização
CREATE OR REPLACE FUNCTION public.get_optimization_stats()
RETURNS TABLE (
  total_images INTEGER,
  total_original_size BIGINT,
  total_optimized_size BIGINT,
  average_compression_ratio DECIMAL(5,2),
  total_savings_mb DECIMAL(10,2)
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COUNT(*)::INTEGER as total_images,
    SUM(original_size)::BIGINT as total_original_size,
    SUM(optimized_size)::BIGINT as total_optimized_size,
    AVG(compression_ratio)::DECIMAL(5,2) as average_compression_ratio,
    (SUM(original_size - optimized_size) / 1024.0 / 1024.0)::DECIMAL(10,2) as total_savings_mb
  FROM public.image_optimizations;
$$;