-- Criar tabela items se não existir
CREATE TABLE IF NOT EXISTS items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('color','frame','effect','theme','badge','title','boost')),
  rarity text NOT NULL CHECK (rarity IN ('common','rare','epic','legendary')),
  value jsonb NOT NULL DEFAULT '{}',
  icon text NOT NULL DEFAULT '🎁',
  description text,
  created_at timestamptz DEFAULT now()
);

-- Garantir que colunas novas existam se a tabela já existir
ALTER TABLE items ADD COLUMN IF NOT EXISTS icon text NOT NULL DEFAULT '🎁';
ALTER TABLE items ADD COLUMN IF NOT EXISTS description text;

ALTER TABLE items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Items viewable by all" ON items;
CREATE POLICY "Items viewable by all" ON items FOR SELECT USING (true);

-- Criar tabela user_inventory se não existir
CREATE TABLE IF NOT EXISTS user_inventory (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  item_id uuid REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  equipped boolean DEFAULT false,
  acquired_at timestamptz DEFAULT now(),
  UNIQUE(user_id, item_id)
);

ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users see own inventory" ON user_inventory;
DROP POLICY IF EXISTS "Users insert own inventory" ON user_inventory;
DROP POLICY IF EXISTS "Users update own inventory" ON user_inventory;
CREATE POLICY "Users see own inventory"    ON user_inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own inventory" ON user_inventory FOR INSERT WITH CHECK (true);
CREATE POLICY "Users update own inventory" ON user_inventory FOR UPDATE USING (auth.uid() = user_id);

-- Popular itens
INSERT INTO items (name, type, rarity, icon, description, value) VALUES
  -- COMUNS
  ('Azul Neon',       'color',  'common',    '🎨', 'Cor de perfil azul neon',         '{"hex":"#00f2ff"}'),
  ('Roxo Cyber',      'color',  'common',    '🎨', 'Cor de perfil roxo cyberpunk',    '{"hex":"#bc13fe"}'),
  ('Rosa Neon',       'color',  'common',    '🎨', 'Cor de perfil rosa neon',         '{"hex":"#ff2079"}'),
  ('Verde Matrix',    'color',  'common',    '🎨', 'Cor de perfil verde matrix',      '{"hex":"#00ff9d"}'),
  ('Laranja Cyber',   'color',  'common',    '🎨', 'Cor de perfil laranja cyber',     '{"hex":"#ff7700"}'),
  ('Analista',        'badge',  'common',    '🏷️', 'Badge de analista no perfil',     '{"badge":"analyst"}'),
  ('Crítico Nato',    'badge',  'common',    '🏷️', 'Badge de crítico no perfil',      '{"badge":"critic"}'),

  -- RAROS
  ('Gradiente Cyber', 'color',  'rare',      '🌈', 'Gradiente azul→roxo no perfil',   '{"gradient":["#00f2ff","#bc13fe"]}'),
  ('Gradiente Aurora','color',  'rare',      '🌈', 'Gradiente verde→azul no perfil',  '{"gradient":["#00ff9d","#00f2ff"]}'),
  ('Gradiente Fogo',  'color',  'rare',      '🌈', 'Gradiente rosa→laranja',          '{"gradient":["#ff2079","#ff7700"]}'),
  ('Moldura Simples', 'frame',  'rare',      '🖼️', 'Moldura neon no avatar',          '{"style":"simple","color":"#00f2ff"}'),
  ('Moldura Roxa',    'frame',  'rare',      '🖼️', 'Moldura roxa no avatar',          '{"style":"simple","color":"#bc13fe"}'),
  ('Glow Suave',      'effect', 'rare',      '✨', 'Efeito glow leve no nome',        '{"type":"glow","intensity":"low"}'),
  ('Curador',         'badge',  'rare',      '🏅', 'Badge de curador no perfil',      '{"badge":"curator"}'),

  -- ÉPICOS
  ('Moldura Dourada', 'frame',  'epic',      '🖼️', 'Moldura dourada animada',         '{"style":"gold","color":"#ffd700","animated":true}'),
  ('Moldura Plasma',  'frame',  'epic',      '🖼️', 'Moldura com efeito plasma',       '{"style":"plasma","animated":true}'),
  ('Glow Intenso',    'effect', 'epic',      '✨', 'Efeito glow intenso no nome',     '{"type":"glow","intensity":"high"}'),
  ('Tema Dark+',      'theme',  'epic',      '💜', 'Variação escura do tema',         '{"id":"dark-plus"}'),
  ('Especialista',    'badge',  'epic',      '🎖️', 'Badge épico de especialista',     '{"badge":"specialist"}'),
  ('Boost de Feed',   'boost',  'epic',      '🔥', 'Suas reviews aparecem em destaque','{"type":"feed","duration_days":7}'),
  ('Título: Mestre',  'title',  'epic',      '👑', 'Título customizado no perfil',    '{"text":"Mestre das Reviews"}'),

  -- LENDÁRIOS
  ('Arco-Íris Neon',  'color',  'legendary', '🌈', 'Cor animada RGB no perfil',       '{"animated":true,"type":"rainbow"}'),
  ('Moldura Lendária','frame',  'legendary', '💎', 'Moldura lendária com partículas', '{"style":"legendary","animated":true,"particles":true}'),
  ('Partículas',      'effect', 'legendary', '💫', 'Partículas flutuando no perfil',  '{"type":"particles"}'),
  ('Tema Neon',       'theme',  'legendary', '⚡', 'Tema neon exclusivo lendário',    '{"id":"neon-legendary"}'),
  ('Cyber God Badge', 'badge',  'legendary', '👾', 'Badge exclusivo do nível máximo', '{"badge":"cyber-god"}'),
  ('Título: Lendário','title',  'legendary', '🏆', 'Título lendário customizado',     '{"text":"Lendário"}'),
  ('Destaque Global', 'boost',  'legendary', '🌐', 'Apareça em destaque no feed global','{"type":"global","duration_days":30}')
ON CONFLICT DO NOTHING;

-- Função para abrir lootbox e dar item real
CREATE OR REPLACE FUNCTION open_lootbox(p_lootbox_id uuid, p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_rarity    text;
  v_roll      float;
  v_item_id   uuid;
  v_item_name text;
  v_item_type text;
  v_item_icon text;
  v_item_desc text;
  v_item_val  jsonb;
BEGIN
  -- Verificar lootbox
  SELECT rarity INTO v_rarity
  FROM lootboxes
  WHERE id = p_lootbox_id AND user_id = p_user_id AND status = 'unopened';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Lootbox não encontrada ou já aberta');
  END IF;

  v_roll := random();

  -- Selecionar item baseado na raridade da lootbox
  SELECT id, name, type, icon, description, value
  INTO v_item_id, v_item_name, v_item_type, v_item_icon, v_item_desc, v_item_val
  FROM items
  WHERE rarity = CASE v_rarity
    WHEN 'legendary' THEN 'legendary'
    WHEN 'epic'      THEN CASE WHEN v_roll > 0.7 THEN 'legendary' ELSE 'epic' END
    WHEN 'rare'      THEN CASE WHEN v_roll > 0.85 THEN 'epic'
                               WHEN v_roll > 0.55 THEN 'rare'
                               ELSE 'common' END
    ELSE                  CASE WHEN v_roll > 0.90 THEN 'rare' ELSE 'common' END
  END
  ORDER BY random()
  LIMIT 1;

  -- Fallback se não encontrou
  IF v_item_id IS NULL THEN
    SELECT id, name, type, icon, description, value
    INTO v_item_id, v_item_name, v_item_type, v_item_icon, v_item_desc, v_item_val
    FROM items ORDER BY random() LIMIT 1;
  END IF;

  -- Marcar lootbox como aberta
  UPDATE lootboxes
  SET status = 'opened', opened_at = now()
  WHERE id = p_lootbox_id;

  -- Adicionar ao inventário (ignora duplicata)
  INSERT INTO user_inventory (user_id, item_id, equipped)
  VALUES (p_user_id, v_item_id, false)
  ON CONFLICT (user_id, item_id) DO NOTHING;

  -- Notificação
  INSERT INTO notifications (user_id, type, title, message, metadata, is_read)
  VALUES (
    p_user_id, 'reward',
    '🎁 Item Obtido!',
    'Você ganhou: ' || v_item_name,
    jsonb_build_object(
      'item_id',   v_item_id,
      'item_name', v_item_name,
      'item_type', v_item_type,
      'item_icon', v_item_icon,
      'rarity',    (SELECT rarity FROM items WHERE id = v_item_id)
    ),
    false
  );

  RETURN jsonb_build_object(
    'success',     true,
    'item_id',     v_item_id,
    'item_name',   v_item_name,
    'item_type',   v_item_type,
    'item_icon',   v_item_icon,
    'description', v_item_desc,
    'value',       v_item_val,
    'rarity',      (SELECT rarity FROM items WHERE id = v_item_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION open_lootbox(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION open_lootbox(uuid, uuid) TO service_role;
