-- Atualizar todos os itens com ícones corretos por tipo:
UPDATE items SET icon = '🎨' WHERE type = 'color';
UPDATE items SET icon = '🖼️' WHERE type = 'frame';
UPDATE items SET icon = '✨' WHERE type = 'effect';
UPDATE items SET icon = '💜' WHERE type = 'theme';
UPDATE items SET icon = '🏅' WHERE type = 'badge';
UPDATE items SET icon = '👑' WHERE type = 'title';
UPDATE items SET icon = '🔥' WHERE type = 'boost';

-- Confirmar:
SELECT name, type, icon FROM items ORDER BY type;
