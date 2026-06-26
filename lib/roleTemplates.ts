import roleData from '@/data/role-templates.json';

export type Archetype = 'funder' | 'builder' | 'organizer' | 'storyteller' | 'strategist';

export interface RoleTemplate {
  slug: string;
  name: string;
  subtitle: string | null;
  entityType: string;
  archetype: Archetype;
  isDisruptive: boolean;
  backstory: string;
  expandedBackstory: string;
  values: string[];
  goals: string[];
  obligations: string[];
  capabilities: string[];
  intellectualProperty: string[];
  rivalrousResources: string[];
  systemicConstraints: Record<string, string>;
  sortOrder: number;
}

export const ARCHETYPES: { value: Archetype; label: string }[] = [
  { value: 'funder', label: 'Funder' },
  { value: 'builder', label: 'Builder' },
  { value: 'organizer', label: 'Organizer' },
  { value: 'storyteller', label: 'Storyteller' },
  { value: 'strategist', label: 'Strategist' },
];

export const ROLE_TEMPLATES: RoleTemplate[] = roleData.roles as RoleTemplate[];

export function getRoleTemplateBySlug(slug: string): RoleTemplate | undefined {
  return ROLE_TEMPLATES.find((t) => t.slug === slug);
}

export function getRoleTemplatesByArchetype(archetype: Archetype): RoleTemplate[] {
  return ROLE_TEMPLATES.filter((t) => t.archetype === archetype);
}

export function getArchetypeLabel(archetype: Archetype): string {
  return ARCHETYPES.find((a) => a.value === archetype)?.label ?? archetype;
}
