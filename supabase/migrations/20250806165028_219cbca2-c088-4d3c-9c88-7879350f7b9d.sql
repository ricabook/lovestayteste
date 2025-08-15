-- Criar bucket para fotos das propriedades
INSERT INTO storage.buckets (id, name, public) VALUES ('property-images', 'property-images', true);

-- Políticas RLS para o bucket property-images
CREATE POLICY "Admins can upload property images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'property-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update property images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'property-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete property images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'property-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Property images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'property-images');