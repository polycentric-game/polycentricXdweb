-- Row Level Security policies for client-side access via Supabase Auth JWT.
-- Run after 001–003. Without these, PostgREST returns 403 for authenticated users.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running (idempotent in dev)
DROP POLICY IF EXISTS "users_select_authenticated" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;

DROP POLICY IF EXISTS "role_templates_select_all" ON role_templates;

DROP POLICY IF EXISTS "games_select_authenticated" ON games;
DROP POLICY IF EXISTS "games_insert_authenticated" ON games;

DROP POLICY IF EXISTS "roles_select_authenticated" ON roles;
DROP POLICY IF EXISTS "roles_insert_own" ON roles;
DROP POLICY IF EXISTS "roles_update_own" ON roles;

DROP POLICY IF EXISTS "agreements_select_authenticated" ON agreements;
DROP POLICY IF EXISTS "agreements_insert_authenticated" ON agreements;
DROP POLICY IF EXISTS "agreements_update_authenticated" ON agreements;

DROP POLICY IF EXISTS "sessions_select_own" ON sessions;
DROP POLICY IF EXISTS "sessions_insert_own" ON sessions;
DROP POLICY IF EXISTS "sessions_update_own" ON sessions;
DROP POLICY IF EXISTS "sessions_delete_own" ON sessions;

-- users: app profile row keyed by auth.users.id
CREATE POLICY "users_select_authenticated"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "users_insert_own"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- role_templates: public catalog (browse without sign-in)
CREATE POLICY "role_templates_select_all"
  ON role_templates FOR SELECT
  TO anon, authenticated
  USING (true);

-- games: lobby visible to signed-in players; creator must match auth user
CREATE POLICY "games_select_authenticated"
  ON games FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "games_insert_authenticated"
  ON games FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- roles: scoped to games; one claim per user per game enforced in app + unique indexes
CREATE POLICY "roles_select_authenticated"
  ON roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "roles_insert_own"
  ON roles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "roles_update_own"
  ON roles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- agreements: signed-in players in a game session
CREATE POLICY "agreements_select_authenticated"
  ON agreements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "agreements_insert_authenticated"
  ON agreements FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "agreements_update_authenticated"
  ON agreements FOR UPDATE
  TO authenticated
  USING (true);

-- sessions: legacy app session table (optional; keyed by user)
CREATE POLICY "sessions_select_own"
  ON sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "sessions_insert_own"
  ON sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "sessions_update_own"
  ON sessions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "sessions_delete_own"
  ON sessions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
