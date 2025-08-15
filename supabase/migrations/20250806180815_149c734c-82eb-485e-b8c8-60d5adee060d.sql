-- Adicionar coluna status à tabela properties
ALTER TABLE public.properties 
ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied'));

-- Atualizar propriedades existentes para 'approved' (assumindo que são do admin)
UPDATE public.properties SET status = 'approved' WHERE status IS NULL OR status = 'pending';

-- Adicionar política para permitir que proprietários criem propriedades
CREATE POLICY "Proprietarios podem criar propriedades"
ON public.properties
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = owner_id 
  AND has_role(auth.uid(), 'proprietario'::app_role)
  AND status = 'pending'
);

-- Política para permitir que proprietários vejam suas próprias propriedades
CREATE POLICY "Proprietarios podem ver suas propriedades"
ON public.properties
FOR SELECT
TO authenticated
USING (
  auth.uid() = owner_id 
  AND has_role(auth.uid(), 'proprietario'::app_role)
);

-- Política para permitir que proprietários editem suas próprias propriedades (apenas se pending)
CREATE POLICY "Proprietarios podem editar propriedades pendentes"
ON public.properties
FOR UPDATE
TO authenticated
USING (
  auth.uid() = owner_id 
  AND has_role(auth.uid(), 'proprietario'::app_role)
  AND status = 'pending'
);

-- Atualizar a política de visualização pública para mostrar apenas propriedades aprovadas
DROP POLICY IF EXISTS "Everyone can view available properties" ON public.properties;

CREATE POLICY "Everyone can view approved properties"
ON public.properties
FOR SELECT
TO anon, authenticated
USING (is_available = true AND status = 'approved');