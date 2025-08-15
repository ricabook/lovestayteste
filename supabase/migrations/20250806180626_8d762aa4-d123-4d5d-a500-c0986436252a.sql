-- Criar políticas de storage para o bucket property-images

-- Política para permitir que proprietários façam upload de imagens
CREATE POLICY "Proprietarios podem fazer upload de imagens"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND has_role(auth.uid(), 'proprietario'::app_role)
);

-- Política para permitir que proprietários vejam suas próprias imagens
CREATE POLICY "Proprietarios podem ver suas proprias imagens"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'property-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND has_role(auth.uid(), 'proprietario'::app_role)
);

-- Política para permitir que admins vejam todas as imagens
CREATE POLICY "Admins podem ver todas as imagens do property-images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'property-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Política para que qualquer um veja imagens públicas (para propriedades aprovadas)
CREATE POLICY "Imagens publicas sao visiveis para todos"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'property-images');