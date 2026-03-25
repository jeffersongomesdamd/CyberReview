-- 1. Atualizar CHECK constraint da tabela items para aceitar novos tipos
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_type_check;
ALTER TABLE items ADD CONSTRAINT items_type_check 
  CHECK (type IN (
    'color','frame','effect','theme','badge','title','boost',
    'review_style','profile_banner','reaction_effect','emoji'
  ));

-- 2. Inserir todos os novos itens
INSERT INTO items (name, type, rarity, icon, description, value) VALUES

-- COMUNS
('Azul Suave',          'color',           'common',    '🎨', 'Cor de perfil azul suave',              '{"hex":"#3b82f6"}'),
('Cinza Urbano',        'color',           'common',    '🎨', 'Cor de perfil cinza urbano',             '{"hex":"#6b7280"}'),
('Glow Leve',           'effect',          'common',    '✨', 'Efeito glow suave no perfil',            '{"effect":"soft-glow"}'),
('Moldura Simples',     'frame',           'common',    '🖼️', 'Moldura básica no avatar',               '{"style":"basic-border"}'),
('Reação Sorriso',      'emoji',           'common',    '😊', 'Emoji de reação nas curtidas',           '{"emoji":"😊"}'),
('Reação Aplauso',      'emoji',           'common',    '👏', 'Emoji de aplauso nas curtidas',          '{"emoji":"👏"}'),
('Banner Gradiente',    'profile_banner',  'common',    '🖥️', 'Banner leve no fundo do perfil',         '{"style":"gradient-light"}'),
('Review Sombra Suave', 'review_style',    'common',    '📝', 'Sombra suave no card de review',         '{"style":"soft-shadow"}'),

-- RAROS
('Cyber Blue',          'color',           'rare',      '🎨', 'Gradiente azul-roxo no perfil',          '{"gradient":["#3b82f6","#bc13fe"]}'),
('Moldura Glass',       'frame',           'rare',      '🖼️', 'Moldura com efeito vidro',               '{"style":"glass"}'),
('Pulso de Luz',        'effect',          'rare',      '✨', 'Efeito de pulso no perfil',              '{"effect":"pulse"}'),
('Reação Fogo',         'emoji',           'rare',      '🔥', 'Emoji de fogo nas curtidas',             '{"emoji":"🔥"}'),
('Reação Raio',         'emoji',           'rare',      '⚡', 'Emoji de raio nas curtidas',             '{"emoji":"⚡"}'),
('Tema Cyber Dark',     'theme',           'rare',      '💜', 'Tema escuro cyberpunk',                  '{"theme":"cyber-dark"}'),
('Review Borda Neon',   'review_style',    'rare',      '📝', 'Borda neon nos cards de review',         '{"style":"neon-border"}'),
('Banner Animado',      'profile_banner',  'rare',      '🖥️', 'Banner com gradiente animado',           '{"style":"animated-gradient"}'),
('Explosão de Curtida', 'reaction_effect', 'rare',      '💥', 'Efeito ao curtir uma review',            '{"effect":"burst","color":"#00f2ff"}'),

-- ÉPICOS
('Moldura Holográfica', 'frame',           'epic',      '🖼️', 'Moldura com efeito holográfico',         '{"style":"holographic"}'),
('Neon Pulse',          'effect',          'epic',      '✨', 'Pulso neon intenso no perfil',           '{"effect":"neon-pulse"}'),
('Tema Galáxia',        'theme',           'epic',      '💜', 'Tema com efeito galáxia',               '{"theme":"galaxy"}'),
('Reação Dourada',      'emoji',           'epic',      '💛', 'Emoji dourado nas curtidas',             '{"emoji":"💛"}'),
('Review Spotlight',    'review_style',    'epic',      '📝', 'Destaque spotlight nos cards',           '{"style":"spotlight"}'),
('Banner Cyber Grid',   'profile_banner',  'epic',      '🖥️', 'Banner com grid cyberpunk',              '{"style":"cyber-grid"}'),
('Review Aura',         'review_style',    'epic',      '📝', 'Brilho em volta de reviews populares',  '{"style":"aura"}'),
('Foco de Criador',     'boost',           'epic',      '👁️', 'Destaque forte no perfil',               '{"type":"focus","duration_days":14}'),
('Explosão Épica',      'reaction_effect', 'epic',      '💥', 'Explosão épica ao curtir',               '{"effect":"explosion","color":"#bc13fe"}'),

-- LENDÁRIOS
('Aura Neon Lendária',  'effect',          'legendary', '✨', 'Aura neon lendária no perfil',           '{"effect":"aura"}'),
('Moldura Obsidiana',   'frame',           'legendary', '🖼️', 'Moldura obsidiana com partículas',       '{"style":"obsidian"}'),
('Tema Void',           'theme',           'legendary', '💜', 'Tema void lendário exclusivo',           '{"theme":"void"}'),
('Reação Coroa',        'emoji',           'legendary', '👑', 'Emoji coroa lendário nas curtidas',      '{"emoji":"👑"}'),
('Ultimate Spotlight',  'review_style',    'legendary', '📝', 'Destaque máximo no feed',                '{"style":"ultimate-highlight"}'),
('Banner Void',         'profile_banner',  'legendary', '🖥️', 'Banner void lendário animado',           '{"style":"void-animated"}'),
('Tema Dinâmico',       'theme',           'legendary', '💜', 'Tema que muda conforme seu nível',       '{"theme":"dynamic-level"}'),
('Destaque Global',     'review_style',    'legendary', '📝', 'Review em destaque no feed global',      '{"style":"global-highlight"}'),
('Reaction Explosion',  'reaction_effect', 'legendary', '💥', 'Explosão máxima ao curtir — viciante',   '{"effect":"mega-explosion","animated":true}')

ON CONFLICT DO NOTHING;

-- 3. Atualizar ícones de itens existentes por tipo
UPDATE items SET icon = '🎨' WHERE type = 'color'           AND icon = '🎁';
UPDATE items SET icon = '🖼️' WHERE type = 'frame'           AND icon = '🎁';
UPDATE items SET icon = '✨' WHERE type = 'effect'          AND icon = '🎁';
UPDATE items SET icon = '💜' WHERE type = 'theme'           AND icon = '🎁';
UPDATE items SET icon = '🏅' WHERE type = 'badge'           AND icon = '🎁';
UPDATE items SET icon = '👑' WHERE type = 'title'           AND icon = '🎁';
UPDATE items SET icon = '🔥' WHERE type = 'boost'           AND icon = '🎁';
UPDATE items SET icon = '📝' WHERE type = 'review_style'    AND icon = '🎁';
UPDATE items SET icon = '🖥️' WHERE type = 'profile_banner'  AND icon = '🎁';
UPDATE items SET icon = '💥' WHERE type = 'reaction_effect' AND icon = '🎁';

-- 4. Confirmar total de itens por raridade:
SELECT rarity, COUNT(*) as total FROM items GROUP BY rarity ORDER BY rarity;
