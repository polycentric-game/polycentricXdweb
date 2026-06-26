#!/usr/bin/env node
/**
 * Generates SQL seed INSERTs for role_templates from data/role-templates.json
 * Run: node scripts/generate-role-seed-sql.mjs > supabase/migrations/002_seed_role_templates.sql
 */

import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const data = JSON.parse(readFileSync(join(root, 'data/role-templates.json'), 'utf8'));

function sqlString(s) {
  if (s == null) return 'NULL';
  return `'${String(s).replace(/'/g, "''")}'`;
}

function sqlArray(arr) {
  if (!arr || arr.length === 0) return 'ARRAY[]::TEXT[]';
  return `ARRAY[${arr.map((v) => sqlString(v)).join(', ')}]`;
}

function sqlJson(obj) {
  return `'${JSON.stringify(obj).replace(/'/g, "''")}'::jsonb`;
}

const values = data.roles.map((role) => {
  return `(
    uuid_generate_v4(),
    ${sqlString(role.slug)},
    ${sqlString(role.name)},
    ${sqlString(role.subtitle)},
    ${sqlString(role.entityType)},
    ${sqlString(role.archetype)},
    ${role.isDisruptive},
    ${sqlString(role.backstory)},
    ${sqlString(role.expandedBackstory)},
    ${sqlArray(role.values)},
    ${sqlArray(role.goals)},
    ${sqlArray(role.obligations)},
    ${sqlArray(role.capabilities)},
    ${sqlArray(role.intellectualProperty)},
    ${sqlArray(role.rivalrousResources)},
    ${sqlJson(role.systemicConstraints)},
    ${role.sortOrder}
  )`;
});

const sql = `-- Auto-generated from data/role-templates.json — do not edit by hand
-- Regenerate: node scripts/generate-role-seed-sql.mjs

INSERT INTO role_templates (
  id, slug, name, subtitle, entity_type, archetype, is_disruptive,
  backstory, expanded_backstory, values, goals, obligations, capabilities,
  intellectual_property, rivalrous_resources, systemic_constraints, sort_order
) VALUES
${values.join(',\n')};
`;

const outPath = join(root, 'supabase/migrations/002_seed_role_templates.sql');
writeFileSync(outPath, sql);
console.log(`Wrote seed SQL for ${data.roles.length} roles to ${outPath}`);
