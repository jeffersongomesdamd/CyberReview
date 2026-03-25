-- Remover itens do tipo boost da pool de drops
-- (não deletar, só marcar como não dropável)
ALTER TABLE items ADD COLUMN IF NOT EXISTS droppable boolean DEFAULT true;
UPDATE items SET droppable = false WHERE type = 'boost';

-- Confirmar:
SELECT name, type, droppable FROM items WHERE type = 'boost';

-- Re-definir a função open_lootbox para respeitar a coluna droppable
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
  v_owned_ids     uuid[];
BEGIN
  SELECT rarity INTO v_rarity
  FROM lootboxes
  WHERE id = p_lootbox_id AND user_id = p_user_id AND status = 'unopened';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Lootbox não encontrada ou já aberta');
  END IF;

  SELECT ARRAY(
    SELECT DISTINCT (CAST(item_value AS jsonb)->>'item_id')::uuid
    FROM user_inventory
    WHERE user_id = p_user_id
      AND item_value IS NOT NULL
      AND (CAST(item_value AS jsonb)->>'item_id') IS NOT NULL
  ) INTO v_owned_ids;

  IF v_owned_ids IS NULL THEN v_owned_ids := ARRAY[]::uuid[]; END IF;

  v_roll := random();
  v_target_rarity := CASE v_rarity
    WHEN 'legendary' THEN 'legendary'
    WHEN 'epic'      THEN CASE WHEN v_roll > 0.70 THEN 'legendary' ELSE 'epic' END
    WHEN 'rare'      THEN CASE WHEN v_roll > 0.85 THEN 'epic'
                               WHEN v_roll > 0.55 THEN 'rare' ELSE 'common' END
    ELSE                  CASE WHEN v_roll > 0.90 THEN 'rare' ELSE 'common' END
  END;

  LOOP
    v_attempts := v_attempts + 1;

    SELECT i.id, i.name, i.type, i.icon, i.description, i.value
    INTO v_item_id, v_item_name, v_item_type, v_item_icon, v_item_desc, v_item_val
    FROM items i
    WHERE i.rarity = v_target_rarity
      AND COALESCE(i.droppable, true) = true  -- exclui boosts e não dropáveis
      AND (array_length(v_owned_ids, 1) IS NULL OR i.id != ALL(v_owned_ids))
    ORDER BY random() LIMIT 1;

    IF v_item_id IS NOT NULL THEN EXIT; END IF;

    v_target_rarity := CASE v_target_rarity
      WHEN 'legendary' THEN 'epic'
      WHEN 'epic'      THEN 'rare'
      WHEN 'rare'      THEN 'common'
      ELSE NULL
    END;

    IF v_target_rarity IS NULL OR v_attempts >= 5 THEN
      SELECT id, name, type, icon, description, value
      INTO v_item_id, v_item_name, v_item_type, v_item_icon, v_item_desc, v_item_val
      FROM items WHERE COALESCE(droppable, true) = true ORDER BY random() LIMIT 1;
      EXIT;
    END IF;
  END LOOP;

  IF v_item_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Nenhum item disponível');
  END IF;

  v_item_rarity := (SELECT rarity FROM items WHERE id = v_item_id);

  UPDATE lootboxes SET status = 'opened', opened_at = now() WHERE id = p_lootbox_id;

  INSERT INTO user_inventory (user_id, item_type, item_value, is_equipped, acquired_at)
  VALUES (p_user_id, v_item_type,
    jsonb_build_object(
      'item_id', v_item_id, 'item_name', v_item_name,
      'item_icon', v_item_icon, 'rarity', v_item_rarity,
      'description', v_item_desc, 'value', v_item_val
    )::text, false, now());

  INSERT INTO notifications (user_id, type, title, message, metadata, is_read)
  VALUES (p_user_id, 'reward', '🎁 Item Obtido!', 'Você ganhou: ' || v_item_name,
    jsonb_build_object('item_id', v_item_id, 'item_name', v_item_name,
      'item_type', v_item_type, 'item_icon', v_item_icon, 'rarity', v_item_rarity), false);

  RETURN jsonb_build_object('success', true, 'item_id', v_item_id,
    'item_name', v_item_name, 'item_type', v_item_type, 'item_icon', v_item_icon,
    'description', v_item_desc, 'rarity', v_item_rarity, 'value', v_item_val);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION open_lootbox(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION open_lootbox(uuid, uuid) TO service_role;
