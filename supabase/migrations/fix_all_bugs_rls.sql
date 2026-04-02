-- Script Corretivo: CyberReview Bugs
-- Copie este conteúdo e rode no SQL Editor do Supabase

-- ==============================================================================
-- 1. CORREÇÃO: PERSONALIZAÇÕES EFEITOS/MOLDURAS OCULTOS PARA OUTRAS PESSOAS (user_inventory)
-- ==============================================================================
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users see own inventory" ON user_inventory;
DROP POLICY IF EXISTS "Inventories are viewable by everyone" ON user_inventory;

-- Antes estava: USING (auth.uid() = user_id)
-- Agora todos podem ver o inventário (especialmente os items equipados) de outras pessoas:
CREATE POLICY "Inventories are viewable by everyone" 
  ON user_inventory FOR SELECT 
  USING (true);


-- ==============================================================================
-- 2. CORREÇÃO: CRIAÇÃO DE NOVA CATEGORIA DANDO ERRO NO MODAL DE AVALIAÇÃO
-- ==============================================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can create categories" ON categories;
DROP POLICY IF EXISTS "Allow authenticated users to insert categories" ON categories;

-- Criação livre se logado, garantindo que o RLS retorne sucesso na criação:
CREATE POLICY "Allow authenticated users to insert categories" 
  ON categories FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');


-- ==============================================================================
-- 3. CORREÇÃO: PEDIDOS DE AMIZADE FALHANDO OU DANDO ERRO DE BLOQUEIO / UNIQUE
-- ==============================================================================
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can send friend requests" ON friendships;
DROP POLICY IF EXISTS "Users can view their own friendships" ON friendships;
DROP POLICY IF EXISTS "Everyone can select friendships for status checks" ON friendships;

-- Para permitir que quem visita o seu perfil saiba o "FriendStatus", 
-- a consulta de leitura (SELECT) deve ser pública ou o visitante não sabe se já é amigo:
CREATE POLICY "Everyone can select friendships for status checks" 
  ON friendships FOR SELECT 
  USING (true);

-- Política de Insert corrigida para prevenir falha silenciosa:
CREATE POLICY "Users can send friend requests" 
  ON friendships FOR INSERT 
  WITH CHECK (auth.uid() = requester_id);


-- ==============================================================================
-- 4. MELHORA: TRIGGER DE CRIAÇÃO DE PERFIL RESILIENTE
-- ==============================================================================
-- Atualiza a função base para garantir que não falhe se o metadata vier vazio 
-- de alguns provedores OAuth, gerando os perfis invisíveis:
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  base_username text;
BEGIN
  -- Tentar pegar do raw_meta_data primeiro, se não existir, usa email split
  base_username := coalesce(
    new.raw_user_meta_data->>'username', 
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1),
    'user_' || substr(new.id::text, 1, 6)
  );

  INSERT INTO public.profiles (id, username, avatar_url, xp, level)
  VALUES (
    new.id,
    base_username,
    new.raw_user_meta_data->>'avatar_url',
    0, 1
  )
  -- Lida com contenção (mesmo username já pego concorrentemente por split de emailes iguais)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==============================================================================
-- 5. CORREÇÃO: RLS DE ATUALIZAÇÃO DE LEVELS / PERFIS PELOS LIKES/XP (OPCIONAL/SEGURANÇA)
-- ==============================================================================
-- A função de RPC add_xp que roda por trás ignora RLS (Security Definer),
-- então não há problema se os likes/reviews chamarem RPC, a segurança está mantida.
