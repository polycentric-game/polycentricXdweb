#!/usr/bin/env node
/**
 * Parses polycentricXdweb.md into data/role-templates.json
 * Run: node scripts/parse-role-templates.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const md = readFileSync(join(root, 'polycentricXdweb.md'), 'utf8');

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseBulletList(text) {
  if (!text) return [];
  return text
    .split(/[•·]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseSystemicConstraints(block) {
  const constraints = {};
  const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const match = line.match(/^-\s\*\*(.+?):\*\*\s*(.+)$/);
    if (match) {
      const key = match[1]
        .replace(/\s+/g, '')
        .replace(/^./, (c) => c.toLowerCase());
      constraints[key] = match[2].trim();
    }
  }
  return constraints;
}

function parseRoleSection(section) {
  const nameMatch = section.match(
    /### \*\*Name: (.+?)(?: – "([^"]+)")?\*\*/
  );
  if (!nameMatch) return null;

  const name = nameMatch[1].trim();
  const subtitle = nameMatch[2]?.trim() || null;
  const isDisruptive = name.startsWith('⚡');
  const cleanName = name.replace(/^⚡\s*/, '').trim();

  const typeMatch = section.match(/\*\*Type:\*\*\s*(.+?)\s+\*\*Archetype:\*\*/);
  const archetypeMatch = section.match(/\*\*Archetype:\*\*\s*\*\*(.+?)\*\*/);
  const backstoryMatch = section.match(/\*\*Backstory:\*\*\s*(.+?)(?=\s+\*\*Expanded Backstory:\*\*|\n\n\*\*)/s);
  const expandedMatch = section.match(/\*\*Expanded Backstory:\*\*\s*(.+?)(?=\n\n\*\*Values:\*\*)/s);
  const valuesMatch = section.match(/\*\*Values:\*\*\s*(.+?)(?=\n\n\*\*Goals:\*\*)/s);
  const goalsMatch = section.match(/\*\*Goals:\*\*\s*(.+?)(?=\n\n\*\*Obligations:\*\*)/s);
  const obligationsMatch = section.match(/\*\*Obligations:\*\*\s*(.+?)(?=\n\n\*\*Capabilities:\*\*)/s);
  const capabilitiesMatch = section.match(/\*\*Capabilities:\*\*\s*(.+?)(?=\n\n\*\*Intellectual Property:\*\*)/s);
  const ipMatch = section.match(/\*\*Intellectual Property:\*\*\s*(.+?)(?=\n\n\*\*Rivalrous Resources:\*\*)/s);
  const resourcesMatch = section.match(/\*\*Rivalrous Resources:\*\*\s*(.+?)(?=\n\n\*\*Systemic Constraints:\*\*)/s);
  const constraintsMatch = section.match(/\*\*Systemic Constraints:\*\*\s*\n([\s\S]+?)(?=\n\n---|\n\n## |\n*$)/);

  const archetype = archetypeMatch?.[1]?.trim() || '';
  const archetypeSlug = archetype.toLowerCase();

  return {
    slug: slugify(cleanName),
    name: cleanName,
    subtitle,
    entityType: typeMatch?.[1]?.trim() || '',
    archetype: archetypeSlug,
    isDisruptive,
    backstory: backstoryMatch?.[1]?.trim().replace(/\s+\*\*Expanded Backstory:\*\*.*$/s, '') || '',
    expandedBackstory: expandedMatch?.[1]?.trim() || '',
    values: parseBulletList(valuesMatch?.[1] || ''),
    goals: parseBulletList(goalsMatch?.[1] || ''),
    obligations: parseBulletList(obligationsMatch?.[1] || ''),
    capabilities: parseBulletList(capabilitiesMatch?.[1] || ''),
    intellectualProperty: parseBulletList(ipMatch?.[1] || ''),
    rivalrousResources: parseBulletList(resourcesMatch?.[1] || ''),
    systemicConstraints: parseSystemicConstraints(constraintsMatch?.[1] || ''),
  };
}

// Split on role headers within archetype sections
const sections = md.split(/(?=### \*\*Name:)/);
const roles = sections.map(parseRoleSection).filter(Boolean);

if (roles.length === 0) {
  console.error('No roles parsed — check markdown format');
  process.exit(1);
}

roles.forEach((role, i) => {
  role.sortOrder = i + 1;
});

const output = {
  version: 1,
  scenario: 'Nomad Infrastructure',
  archetypes: ['funder', 'builder', 'organizer', 'storyteller', 'strategist'],
  roles,
};

const outDir = join(root, 'data');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, 'role-templates.json');
writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n');
console.log(`Wrote ${roles.length} roles to ${outPath}`);
