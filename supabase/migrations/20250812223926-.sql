-- Alterar a coluna phone para whatsapp_number e torná-la obrigatória
ALTER TABLE public.profiles 
RENAME COLUMN phone TO whatsapp_number;

-- Tornar o campo obrigatório (NOT NULL)
-- Primeiro, vamos atualizar registros existentes que têm o campo nulo
UPDATE public.profiles 
SET whatsapp_number = '' 
WHERE whatsapp_number IS NULL;

-- Agora podemos adicionar a constraint NOT NULL
ALTER TABLE public.profiles 
ALTER COLUMN whatsapp_number SET NOT NULL;