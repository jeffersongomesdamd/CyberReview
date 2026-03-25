-- Atualizar a função open_lootbox para evitar itens repetidos
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

  -- 1. Tentar selecionar item da raridade sorteada que o usuário NÃO tenha
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
  AND id NOT IN (SELECT item_id FROM user_inventory WHERE user_id = p_user_id)
  ORDER BY random()
  LIMIT 1;

  -- 2. Se não encontrou (usuário já tem todos dessa raridade), tenta QUALQUER item que ele não tenha
  IF v_item_id IS NULL THEN
    SELECT id, name, type, icon, description, value
    INTO v_item_id, v_item_name, v_item_type, v_item_icon, v_item_desc, v_item_val
    FROM items
    WHERE id NOT IN (SELECT item_id FROM user_inventory WHERE user_id = p_user_id)
    ORDER BY rarity DESC, random()
    LIMIT 1;
  END IF;

  -- 3. Se AINDA assim for nulo (usuário tem absolutamente tudo), pega um aleatório mesmo
  IF v_item_id IS NULL THEN
    SELECT id, name, type, icon, description, value
    INTO v_item_id, v_item_name, v_item_type, v_item_icon, v_item_desc, v_item_val
    FROM items
    ORDER BY random()
    LIMIT 1;
  END IF;

  -- Marcar lootbox como aberta
  UPDATE lootboxes
  SET status = 'opened', opened_at = now()
  WHERE id = p_lootbox_id;

  -- Adicionar ao inventário (ignora duplicata por causa da constraint UNIQUE na tabela)
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
