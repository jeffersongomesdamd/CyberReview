-- Este script implementa um sistema de cooldown (anti-spam) para criações
-- Basta colar e rodar no SQL Editor do Supabase.

CREATE OR REPLACE FUNCTION check_rate_limit()
RETURNS trigger AS $$
DECLARE
    last_action timestamp;
    cooldown interval;
BEGIN
    -- Define o tempo de cooldown de acordo com a tabela
    IF TG_TABLE_NAME = 'reviews' THEN
        -- Se for clone (cloned_from_id tem valor), o cooldown é menor
        IF NEW.cloned_from IS NOT NULL THEN
            cooldown := '30 seconds'::interval;
        ELSE
            -- Review original
            cooldown := '1 minute'::interval;
        END IF;

    ELSIF TG_TABLE_NAME = 'comments' THEN
        cooldown := '15 seconds'::interval;
    ELSE
        cooldown := '5 seconds'::interval;
    END IF;

    -- Busca a última ação do usuário na tabela correspondente
    EXECUTE format('SELECT created_at FROM %I WHERE author_id = $1 ORDER BY created_at DESC LIMIT 1', TG_TABLE_NAME)
    INTO last_action
    USING NEW.author_id;

    -- Levanta exceção se a condição não for respeitada
    IF last_action IS NOT NULL AND (now() - last_action) < cooldown THEN
        RAISE EXCEPTION 'anti_spam_cooldown';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remove triggers antigos caso existam para evitar duplicidade
DROP TRIGGER IF EXISTS reviews_rate_limit ON reviews;
DROP TRIGGER IF EXISTS comments_rate_limit ON comments;

-- Cria os triggers
CREATE TRIGGER reviews_rate_limit
    BEFORE INSERT ON reviews
    FOR EACH ROW EXECUTE PROCEDURE check_rate_limit();

CREATE TRIGGER comments_rate_limit
    BEFORE INSERT ON comments
    FOR EACH ROW EXECUTE PROCEDURE check_rate_limit();
