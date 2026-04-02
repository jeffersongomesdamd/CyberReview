-- 1. ADICIONA A COLUNA DE COMENTÁRIOS E PREENCHE PRE-EXISTENTES
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS comment_count integer DEFAULT 0;

-- Sincroniza qualquer count preexistente perfeitamente para não perder nenhum comentário que já estava no banco
UPDATE public.reviews r
SET comment_count = (
  SELECT count(*) FROM public.comments c WHERE c.review_id = r.id
);

-- 2. RECRIAR O GATILHO DE LIKES COM "SECURITY DEFINER"
-- O Security Definer permite que a função evada o RLS durante a sua transação para realizar updates nas Reviews
CREATE OR REPLACE FUNCTION public.update_like_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.reviews SET like_count = like_count + 1 WHERE id = NEW.review_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.reviews SET like_count = like_count - 1 WHERE id = OLD.review_id;
  END IF;
  RETURN NULL;
END;
$$;

-- 3. CRIAR O GATILHO DE COMENTÁRIOS COM "SECURITY DEFINER"
CREATE OR REPLACE FUNCTION public.update_comment_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.reviews SET comment_count = comment_count + 1 WHERE id = NEW.review_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.reviews SET comment_count = comment_count - 1 WHERE id = OLD.review_id;
  END IF;
  RETURN NULL;
END;
$$;

-- 4. CONECTAR O LISNETER DE COMENTÁRIOS
DROP TRIGGER IF EXISTS on_comment_change ON public.comments;
CREATE TRIGGER on_comment_change
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE PROCEDURE public.update_comment_count();

-- Lembrete: O trigger on_like_change não precisa ser recriado desde que já existe, 
-- ele usará automaticamente a versão corrigida da função update_like_count.
