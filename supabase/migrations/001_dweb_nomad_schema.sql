-- DWeb Nomad Infrastructure schema (narrative-only agreements)
-- For new Supabase projects, run 001 then 002.
-- Legacy equity-swap migrations are in supabase/migrations/legacy/

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  ethereum_address TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Static role catalog (seeded in 002_seed_role_templates.sql)
CREATE TABLE role_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  subtitle TEXT,
  entity_type TEXT NOT NULL,
  archetype TEXT NOT NULL CHECK (archetype IN ('funder', 'builder', 'organizer', 'storyteller', 'strategist')),
  is_disruptive BOOLEAN NOT NULL DEFAULT FALSE,
  backstory TEXT NOT NULL,
  expanded_backstory TEXT NOT NULL DEFAULT '',
  values TEXT[] NOT NULL DEFAULT '{}',
  goals TEXT[] NOT NULL DEFAULT '{}',
  obligations TEXT[] NOT NULL DEFAULT '{}',
  capabilities TEXT[] NOT NULL DEFAULT '{}',
  intellectual_property TEXT[] NOT NULL DEFAULT '{}',
  rivalrous_resources TEXT[] NOT NULL DEFAULT '{}',
  systemic_constraints JSONB NOT NULL DEFAULT '{}',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player role instances (one user may claim one template per game session)
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES role_templates(id) ON DELETE RESTRICT,
  player_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (template_id)
);

-- Bilateral agreements with narrative terms in versions JSONB
CREATE TABLE agreements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  party_a_role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  party_b_role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('proposed', 'revised', 'approved', 'completed')),
  initiated_by UUID NOT NULL REFERENCES roles(id),
  last_revised_by UUID NOT NULL REFERENCES roles(id),
  current_version INTEGER DEFAULT 0,
  versions JSONB NOT NULL DEFAULT '[]',
  party_a_address TEXT,
  party_b_address TEXT,
  canonical_terms_json TEXT,
  terms_hash TEXT,
  sig_a TEXT,
  sig_b TEXT,
  finalized_at TIMESTAMP WITH TIME ZONE,
  vc_jwt TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_ethereum_address ON users(ethereum_address);
CREATE INDEX idx_role_templates_archetype ON role_templates(archetype);
CREATE INDEX idx_roles_user_id ON roles(user_id);
CREATE INDEX idx_roles_template_id ON roles(template_id);
CREATE INDEX idx_agreements_party_a ON agreements(party_a_role_id);
CREATE INDEX idx_agreements_party_b ON agreements(party_b_role_id);
CREATE INDEX idx_agreements_finalized_at ON agreements(finalized_at);
CREATE INDEX idx_agreements_terms_hash ON agreements(terms_hash);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agreements_updated_at BEFORE UPDATE ON agreements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
