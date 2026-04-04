-- ============================================================
-- FIX: comment_count nos cards das reviews
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- 1. Garante que a coluna existe (idempotente)
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS comment_count integer DEFAULT 0;

-- 2. Backfill: sincroniza o count real para TODAS as reviews existentes
UPDATE public.reviews r
SET comment_count = (
  SELECT COUNT(*) FROM public.comments c WHERE c.review_id = r.id
);

-- 3. Recria a função com SECURITY DEFINER (necessário para bypassar RLS)
CREATE OR REPLACE FUNCTION public.update_comment_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.reviews
    SET comment_count = GREATEST(comment_count + 1, 0)
    WHERE id = NEW.review_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.reviews
    SET comment_count = GREATEST(comment_count - 1, 0)
    WHERE id = OLD.review_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- 4. Remove trigger antigo (se existir) e recria
DROP TRIGGER IF EXISTS on_comment_change ON public.comments;

CREATE TRIGGER on_comment_change
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE PROCEDURE public.update_comment_count();

-- 5. Garante que a função de likes também tem SECURITY DEFINER (para consistência)
CREATE OR REPLACE FUNCTION public.update_like_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.reviews
    SET like_count = GREATEST(like_count + 1, 0)
    WHERE id = NEW.review_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.reviews
    SET like_count = GREATEST(like_count - 1, 0)
    WHERE id = OLD.review_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Verificação: mostra reviews com comentários para confirmar
SELECT r.id, r.title, r.comment_count,
       (SELECT COUNT(*) FROM public.comments c WHERE c.review_id = r.id) AS real_count
FROM public.reviews r
WHERE r.comment_count > 0 OR EXISTS (SELECT 1 FROM public.comments c WHERE c.review_id = r.id)
ORDER BY r.comment_count DESC
LIMIT 20;
