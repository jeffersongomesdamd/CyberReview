-- 1. Verificar políticas atuais da tabela lootboxes:
/*
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'lootboxes';
*/

-- 2. Adicionar política que permite INSERT via funções SECURITY DEFINER:
DROP POLICY IF EXISTS "Service can insert lootboxes" ON lootboxes;
DROP POLICY IF EXISTS "Allow insert lootboxes" ON lootboxes;

-- Política permissiva para INSERT (a função roda como owner do schema):
CREATE POLICY "Allow all inserts on lootboxes"
  ON lootboxes FOR INSERT
  WITH CHECK (true);

-- 3. Mesma coisa para notifications:
DROP POLICY IF EXISTS "Allow insert notifications" ON notifications;
CREATE POLICY "Allow all inserts on notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- 4. Testar AGORA manualmente:
-- NOTA: Substitua 'Jefferson' pelo seu username se necessário
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT id INTO v_user_id FROM profiles WHERE username = 'Jefferson';
    
    IF v_user_id IS NOT NULL THEN
        -- Simular ganho de XP que deve triggar lootbox/level up
        UPDATE profiles SET xp = 4000, level = 9 WHERE id = v_user_id;

        PERFORM add_xp(v_user_id, 55);
        
        RAISE NOTICE 'XP adicinado para o usuário %. Verifique as tabelas lootboxes e notifications.', v_user_id;
    ELSE
        RAISE NOTICE 'Usuário Jefferson não encontrado.';
    END IF;
END $$;

-- 5. Confirmar resultado:
SELECT xp, level FROM profiles WHERE username = 'Jefferson';

SELECT id, rarity, status, created_at
FROM lootboxes
WHERE user_id = (SELECT id FROM profiles WHERE username = 'Jefferson')
ORDER BY created_at DESC LIMIT 5;

-- 6. Se ainda não criou, verificar se a função existe com a versão correta:
SELECT prosrc FROM pg_proc WHERE proname = 'add_xp';
-- O resultado deve conter "FOR v_check_level IN"
-- Se não contiver, a função antiga ainda está ativa — recriar com o SQL do prompt anterior
