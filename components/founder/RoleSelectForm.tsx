'use client';

import React, { useEffect, useState } from 'react';
import { RoleTemplate, ARCHETYPES, getArchetypeLabel } from '@/lib/roleTemplates';
import { validateRoleSelection } from '@/lib/validation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

interface RoleSelectFormProps {
  templates: RoleTemplate[];
  claimedTemplateIds: Set<string>;
  onSubmit: (templateId: string, playerName?: string) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function RoleSelectForm({
  templates,
  claimedTemplateIds,
  onSubmit,
  onCancel,
  isLoading = false,
}: RoleSelectFormProps) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selected = templates.find((t) => t.slug === selectedSlug) ?? null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const template = templates.find((t) => t.slug === selectedSlug);
    if (!template) {
      setErrors({ templateId: 'Please select a role' });
      return;
    }
    const templateWithId = template as RoleTemplate & { id?: string };
    const templateId = (templateWithId as any).id ?? selectedSlug;
    const validationErrors = validateRoleSelection(templateId, playerName);
    if (validationErrors.length > 0) {
      const map: Record<string, string> = {};
      validationErrors.forEach((err) => {
        map[err.field] = err.message;
      });
      setErrors(map);
      return;
    }
    onSubmit(templateId, playerName.trim() || undefined);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="font-space-grotesk font-bold text-2xl text-gray-900 dark:text-gray-100">
          Select Your Role
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Choose one of 31 roles from the DWeb Nomad Infrastructure deck.
        </p>
      </div>

      {ARCHETYPES.map(({ value: archetype }) => {
        const archetypeRoles = templates.filter((t) => t.archetype === archetype);
        if (archetypeRoles.length === 0) return null;
        return (
          <div key={archetype} className="space-y-3">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
              {getArchetypeLabel(archetype)}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {archetypeRoles.map((template) => {
                const templateId = (template as any).id ?? template.slug;
                const isClaimed = claimedTemplateIds.has(templateId);
                const isSelected = selectedSlug === template.slug;
                return (
                  <button
                    key={template.slug}
                    type="button"
                    disabled={isClaimed}
                    onClick={() => {
                      setSelectedSlug(template.slug);
                      setErrors({});
                    }}
                    className={`text-left p-4 rounded-lg border transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : isClaimed
                          ? 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                          : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {template.isDisruptive && <span className="mr-1">⚡</span>}
                      {template.name}
                    </div>
                    {template.subtitle && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">{template.subtitle}</div>
                    )}
                    {isClaimed && (
                      <div className="text-xs text-gray-500 mt-1">Already claimed</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {selected && (
        <Card className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">{selected.name}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{selected.backstory}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-gray-500 mb-1">Rivalrous resources</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">{selected.rivalrousResources.join(' · ')}</p>
          </div>
        </Card>
      )}

      <Input
        label="Display name (optional)"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        error={errors.playerName}
        placeholder="Your in-game name"
      />

      {errors.templateId && <p className="text-sm text-danger">{errors.templateId}</p>}

      <div className="flex gap-4 justify-end">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button onClick={handleSubmit} loading={isLoading} disabled={!selectedSlug}>
          Claim Role
        </Button>
      </div>
    </div>
  );
}

// Keep export alias for gradual migration
export { RoleSelectForm as FounderForm };
