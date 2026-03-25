-- 1. Função para equipar item (garante só 1 por tipo)
CREATE OR REPLACE FUNCTION equip_item(p_inventory_id uuid, p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_item_type text;
  v_currently_equipped boolean;
BEGIN
  SELECT item_type, is_equipped 
  INTO v_item_type, v_currently_equipped
  FROM user_inventory 
  WHERE id = p_inventory_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Item não encontrado');
  END IF;

  IF v_currently_equipped THEN
    -- Desequipar
    UPDATE user_inventory SET is_equipped = false WHERE id = p_inventory_id;
    RETURN jsonb_build_object('success', true, 'equipped', false);
  ELSE
    -- Desequipar todos os outros do mesmo tipo primeiro
    UPDATE user_inventory 
    SET is_equipped = false 
    WHERE user_id = p_user_id 
      AND item_type = v_item_type 
      AND id != p_inventory_id;
    
    -- Equipar este
    UPDATE user_inventory SET is_equipped = true WHERE id = p_inventory_id;
    RETURN jsonb_build_object('success', true, 'equipped', true);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION equip_item(uuid, uuid) TO authenticated;

-- 2. Corrigir open_lootbox para não dar item já possuído
CREATE OR REPLACE FUNCTION open_lootbox(p_lootbox_id uuid, p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_rarity        text;
  v_roll          float;
  v_target_rarity text;
  v_item_id       uuid;
  v_item_name     text;
  v_item_type     text;
  v_item_icon     text;
  v_item_desc     text;
  v_item_val      jsonb;
  v_item_rarity   text;
  v_attempts      integer := 0;
BEGIN
  SELECT rarity INTO v_rarity
  FROM lootboxes
  WHERE id = p_lootbox_id AND user_id = p_user_id AND status = 'unopened';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Lootbox não encontrada ou já aberta');
  END IF;

  v_roll := random();

  v_target_rarity := CASE v_rarity
    WHEN 'legendary' THEN 'legendary'
    WHEN 'epic'      THEN CASE WHEN v_roll > 0.70 THEN 'legendary' ELSE 'epic' END
    WHEN 'rare'      THEN CASE WHEN v_roll > 0.85 THEN 'epic'
                               WHEN v_roll > 0.55 THEN 'rare'
                               ELSE 'common' END
    ELSE                  CASE WHEN v_roll > 0.90 THEN 'rare' ELSE 'common' END
  END;

  -- Tentar achar item que o usuário NÃO tem ainda
  -- Tenta até 5 vezes com raridades diferentes se necessário
  LOOP
    v_attempts := v_attempts + 1;

    SELECT i.id, i.name, i.type, i.icon, i.description, i.value
    INTO v_item_id, v_item_name, v_item_type, v_item_icon, v_item_desc, v_item_val
    FROM items i
    WHERE i.rarity = v_target_rarity
      -- Excluir itens que o usuário já possui
      AND NOT EXISTS (
        SELECT 1 FROM user_inventory ui
        WHERE ui.user_id = p_user_id
          AND (ui.item_value->>'item_id')::uuid = i.id
      )
    ORDER BY random()
    LIMIT 1;

    -- Achou item novo → sai do loop
    IF v_item_id IS NOT NULL THEN
      EXIT;
    END IF;

    -- Não achou nessa raridade → tenta raridade abaixo
    v_target_rarity := CASE v_target_rarity
      WHEN 'legendary' THEN 'epic'
      WHEN 'epic'      THEN 'rare'
      WHEN 'rare'      THEN 'common'
      ELSE NULL
    END;

    -- Se esgotou todas as raridades ou tentou demais → pega qualquer item
    IF v_target_rarity IS NULL OR v_attempts >= 5 THEN
      SELECT i.id, i.name, i.type, i.icon, i.description, i.value
      INTO v_item_id, v_item_name, v_item_type, v_item_icon, v_item_desc, v_item_val
      FROM items i
      ORDER BY random()
      LIMIT 1;
      EXIT;
    END IF;
  END LOOP;

  IF v_item_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Nenhum item disponível');
  END IF;

  v_item_rarity := (SELECT rarity FROM items WHERE id = v_item_id);

  UPDATE lootboxes SET status = 'opened', opened_at = now() WHERE id = p_lootbox_id;

  INSERT INTO user_inventory (user_id, item_type, item_value, is_equipped, acquired_at)
  VALUES (
    p_user_id, v_item_type,
    jsonb_build_object(
      'item_id',     v_item_id,
      'item_name',   v_item_name,
      'item_icon',   v_item_icon,
      'rarity',      v_item_rarity,
      'description', v_item_desc,
      'value',       v_item_val
    ),
    false, now()
  );

  INSERT INTO notifications (user_id, type, title, message, metadata, is_read)
  VALUES (
    p_user_id, 'reward', '🎁 Item Obtido!',
    'Você ganhou: ' || v_item_name,
    jsonb_build_object(
      'item_id',   v_item_id,
      'item_name', v_item_name,
      'item_type', v_item_type,
      'item_icon', v_item_icon,
      'rarity',    v_item_rarity
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
    'rarity',      v_item_rarity,
    'value',       v_item_val
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION open_lootbox(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION open_lootbox(uuid, uuid) TO service_role;
