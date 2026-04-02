-- 1. APAGAR O USUÁRIO PROBLEMÁTICO (Caso deseje recomeçar do zero)
-- Substitua pelo e-mail correto se necessário
DELETE FROM auth.users WHERE email = 'raiobrine489@gmail.com'; 

-- 2. ATUALIZAR O TRIGGER DE CRIAÇÃO DE PERFIL
-- Esta versão é mais robusta, limpa o nome e resolve colisões.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  base_username text;
  final_username text;
  counter integer := 0;
BEGIN
  -- 1. Tentar pegar do metadata, senão usa o prefixo do e-mail
  base_username := coalesce(
    new.raw_user_meta_data->>'username', 
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1)
  );

  -- 2. Limpeza: remove caracteres que não sejam letras, números, _ . ou -
  base_username := regexp_replace(base_username, '[^a-zA-Z0-9_.-]', '', 'g');

  -- 3. Caso o nome fique vazio após a limpeza
  IF base_username = '' OR base_username IS NULL THEN
    base_username := 'user_' || substr(new.id::text, 1, 6);
  END IF;

  final_username := base_username;

  -- 4. Loop para encontrar um username único (Anti-colisão)
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter::text;
  END LOOP;

  -- 5. Inserir ou Atualizar (Upsert)
  INSERT INTO public.profiles (id, username, avatar_url, xp, level)
  VALUES (
    new.id,
    final_username,
    new.raw_user_meta_data->>'avatar_url',
    0, 1
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    avatar_url = EXCLUDED.avatar_url;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ADICIONAR ÍNDICE PARA BUSCA RÁPIDA POR USERNAME (Importante para performance)
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (username);
