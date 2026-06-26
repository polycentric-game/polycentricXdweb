-- Games: multiplayer sessions with scoped role claims

CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE roles ADD COLUMN game_id UUID REFERENCES games(id) ON DELETE CASCADE;

-- Was global one-template-per-db; now one template per game
ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_template_id_key;

CREATE UNIQUE INDEX roles_game_template_unique ON roles (game_id, template_id) WHERE game_id IS NOT NULL;
CREATE UNIQUE INDEX roles_game_user_unique ON roles (game_id, user_id) WHERE game_id IS NOT NULL;

CREATE INDEX idx_games_created_by ON games(created_by);
CREATE INDEX idx_games_title ON games(title);
CREATE INDEX idx_roles_game_id ON roles(game_id);

CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
