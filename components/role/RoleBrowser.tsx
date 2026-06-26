'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { RoleTemplate, ARCHETYPES, Archetype, getArchetypeLabel } from '@/lib/roleTemplates';
import { validateRoleSelection } from '@/lib/validation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export type RoleTemplateWithId = RoleTemplate & { id: string };

interface RoleBrowserProps {
  templates: RoleTemplateWithId[];
  claimedTemplateIds: Set<string>;
  isLoadingTemplates?: boolean;
  /** When true, hide claim UI — browse deck only */
  browseOnly?: boolean;
  canClaim?: boolean;
  signedIn?: boolean;
  isAuthenticating?: boolean;
  authError?: string | null;
  hasExistingRole?: boolean;
  onSubmit?: (templateId: string, playerName?: string) => void;
  isClaiming?: boolean;
  claimError?: string | null;
}

function BulletList({ items, label }: { items: string[]; label: string }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
        {label}
      </p>
      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function RoleBrowser({
  templates,
  claimedTemplateIds,
  isLoadingTemplates = false,
  browseOnly = false,
  canClaim = false,
  signedIn = false,
  isAuthenticating = false,
  authError,
  hasExistingRole = false,
  onSubmit,
  isClaiming = false,
  claimError,
}: RoleBrowserProps) {
  const [activeArchetype, setActiveArchetype] = useState<Archetype | 'all'>('all');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredTemplates = useMemo(() => {
    if (activeArchetype === 'all') return templates;
    return templates.filter((t) => t.archetype === activeArchetype);
  }, [templates, activeArchetype]);

  const selected = templates.find((t) => t.slug === selectedSlug) ?? null;

  const isTemplateClaimed = (template: RoleTemplateWithId) => {
    return claimedTemplateIds.has(template.id) || claimedTemplateIds.has(template.slug);
  };

  const handleClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canClaim || hasExistingRole) return;

    const template = templates.find((t) => t.slug === selectedSlug);
    if (!template) {
      setErrors({ templateId: 'Please select a role to claim' });
      return;
    }

    if (isTemplateClaimed(template)) {
      setErrors({ templateId: 'This role has already been claimed by another player' });
      return;
    }

    const validationErrors = validateRoleSelection(template.id, playerName);
    if (validationErrors.length > 0) {
      const map: Record<string, string> = {};
      validationErrors.forEach((err) => {
        map[err.field] = err.message;
      });
      setErrors(map);
      return;
    }

    setErrors({});
    onSubmit?.(template.id, playerName.trim() || undefined);
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="font-space-grotesk font-bold text-3xl md:text-4xl text-gray-900 dark:text-gray-100">
          DWeb Nomad Roles
        </h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Browse all 31 roles from the Nomad Infrastructure deck. Select one to see its full card,
          then claim it to join the game.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        <button
          type="button"
          onClick={() => setActiveArchetype('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeArchetype === 'all'
              ? 'bg-primary text-black'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          All ({templates.length})
        </button>
        {ARCHETYPES.map(({ value, label }) => {
          const count = templates.filter((t) => t.archetype === value).length;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setActiveArchetype(value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeArchetype === value
                  ? 'bg-primary text-black'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {isLoadingTemplates && templates.length === 0 ? (
        <div className="text-center py-12 text-gray-600 dark:text-gray-300">Loading roles...</div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-3 max-h-[32rem] overflow-y-auto pr-1">
            {filteredTemplates.map((template) => {
              const claimed = isTemplateClaimed(template);
              const isSelected = selectedSlug === template.slug;
              return (
                <button
                  key={template.slug}
                  type="button"
                  onClick={() => {
                    setSelectedSlug(template.slug);
                    setErrors({});
                  }}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary/40'
                  } ${claimed ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {template.isDisruptive && <span className="mr-1">⚡</span>}
                        {template.name}
                      </div>
                      {template.subtitle && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          {template.subtitle}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {template.entityType}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge variant="secondary">{getArchetypeLabel(template.archetype)}</Badge>
                      {claimed && <span className="text-xs text-gray-500">Claimed</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="space-y-6">
            {selected ? (
              <Card className="space-y-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h2 className="font-space-grotesk font-bold text-xl text-gray-900 dark:text-gray-100">
                      {selected.isDisruptive && '⚡ '}
                      {selected.name}
                    </h2>
                    <Badge>{getArchetypeLabel(selected.archetype)}</Badge>
                    {selected.isDisruptive && <Badge variant="secondary">Disruptive</Badge>}
                  </div>
                  {selected.subtitle && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{selected.subtitle}</p>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">{selected.backstory}</p>
                  {selected.expandedBackstory && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                      {selected.expandedBackstory}
                    </p>
                  )}
                </div>

                <BulletList items={selected.values} label="Values" />
                <BulletList items={selected.goals} label="Goals" />
                <BulletList items={selected.obligations} label="Obligations" />
                <BulletList items={selected.capabilities} label="Capabilities" />
                <BulletList items={selected.intellectualProperty} label="Intellectual property" />
                <BulletList items={selected.rivalrousResources} label="Rivalrous resources" />

                {Object.keys(selected.systemicConstraints).length > 0 && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                      Systemic constraints
                    </p>
                    <dl className="space-y-1 text-sm">
                      {Object.entries(selected.systemicConstraints).map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <dt className="text-gray-500 dark:text-gray-400 capitalize shrink-0">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </dt>
                          <dd className="text-gray-700 dark:text-gray-300">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </Card>
            ) : (
              <Card className="py-16 text-center text-gray-500 dark:text-gray-400">
                Select a role from the list to view its full card
              </Card>
            )}

            {!browseOnly && (
            <Card className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Claim this role</h3>

              {hasExistingRole ? (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  You already have a role in this session. Visit your profile or join the game network.
                </p>
              ) : isAuthenticating ? (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Setting up your session…
                </p>
              ) : authError ? (
                <p className="text-sm text-danger">{authError}</p>
              ) : !signedIn ? (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Sign in to claim a role.
                </p>
              ) : (
                <form onSubmit={handleClaim} className="space-y-4">
                  <Input
                    label="Display name (optional)"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    error={errors.playerName}
                    placeholder="Your in-game name"
                    disabled={!selected || isTemplateClaimed(selected)}
                  />

                  {errors.templateId && (
                    <p className="text-sm text-danger">{errors.templateId}</p>
                  )}
                  {claimError && <p className="text-sm text-danger">{claimError}</p>}

                  <Button
                    type="submit"
                    loading={isClaiming}
                    disabled={!selected || !canClaim || (selected && isTemplateClaimed(selected))}
                    className="w-full sm:w-auto"
                  >
                    {selected && isTemplateClaimed(selected)
                      ? 'Role unavailable'
                      : 'Claim role'}
                  </Button>
                </form>
              )}
            </Card>
            )}

            {browseOnly && (
              <Card className="space-y-2">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Claim a role</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <Link href="/games" className="text-primary hover:underline">
                    Create or join a game
                  </Link>{' '}
                  to claim a role from this deck.
                </p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
