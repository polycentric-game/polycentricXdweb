'use client';

import React, { useMemo, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { createAgreement, proposeRevision } from '@/lib/agreements';
import { validateAgreementTerms } from '@/lib/validation';
import { getRoleDisplayName, Agreement } from '@/lib/types';
import { toast } from '@/lib/toastStore';
import { getPartyRoleIds, samePartySet } from '@/lib/agreementHelpers';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';

const SESSION_SIGNATURE = 'email-session-v1';

interface AgreementFormProps {
  agreement?: Agreement;
  /** Pre-select counterparty roles when opening from a profile link */
  defaultCounterpartyRoleIds?: string[];
  onSubmit: (agreement: Agreement) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function buildInitialCommitments(
  agreement: Agreement | undefined,
  partyRoleIds: string[]
): Record<string, string> {
  if (!agreement) {
    return Object.fromEntries(partyRoleIds.map((id) => [id, '']));
  }
  const version = agreement.versions[agreement.currentVersion];
  if (!version) {
    return Object.fromEntries(partyRoleIds.map((id) => [id, '']));
  }
  return Object.fromEntries(
    partyRoleIds.map((id) => [id, version.commitments[id] ?? ''])
  );
}

export function AgreementForm({
  agreement,
  defaultCounterpartyRoleIds = [],
  onSubmit,
  onCancel,
  isLoading = false,
}: AgreementFormProps) {
  const { currentRole, roles, agreements, updateAgreement, addAgreement } = useAppStore();

  const otherRoles = roles.filter((r) => r.id !== currentRole?.id);
  const isRevision = Boolean(agreement);

  const partyRoleIds = useMemo(() => {
    if (agreement) return getPartyRoleIds(agreement);
    return currentRole ? [currentRole.id] : [];
  }, [agreement, currentRole]);

  const [selectedCounterpartyIds, setSelectedCounterpartyIds] = useState<string[]>(() => {
    if (agreement) {
      return getPartyRoleIds(agreement).filter((id) => id !== currentRole?.id);
    }
    const validDefaults = defaultCounterpartyRoleIds.filter((id) =>
      otherRoles.some((r) => r.id === id)
    );
    return validDefaults;
  });

  const activePartyRoleIds = useMemo(() => {
    if (!currentRole) return [];
    if (isRevision) return partyRoleIds;
    return [currentRole.id, ...selectedCounterpartyIds];
  }, [currentRole, isRevision, partyRoleIds, selectedCounterpartyIds]);

  const currentVersion = agreement?.versions[agreement.currentVersion];

  const [commitments, setCommitments] = useState<Record<string, string>>(() =>
    buildInitialCommitments(agreement, activePartyRoleIds)
  );
  const [notes, setNotes] = useState(currentVersion?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  if (!currentRole) return null;

  const toggleCounterparty = (roleId: string) => {
    setSelectedCounterpartyIds((prev) => {
      const next = prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId];

      const nextPartyIds = [currentRole.id, ...next];
      setCommitments((current) => {
        const updated = { ...current };
        for (const id of nextPartyIds) {
          if (!(id in updated)) updated[id] = '';
        }
        for (const id of Object.keys(updated)) {
          if (!nextPartyIds.includes(id)) delete updated[id];
        }
        return updated;
      });

      return next;
    });
    setErrors({});
  };

  const proposedPartySet = [...activePartyRoleIds].sort();

  const existingAgreement =
    !isRevision && selectedCounterpartyIds.length > 0
      ? agreements.find((a) => samePartySet(getPartyRoleIds(a), proposedPartySet))
      : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    if (!isRevision && selectedCounterpartyIds.length === 0) {
      setErrors({ parties: 'Select at least one other role for this agreement.' });
      setSubmitting(false);
      return;
    }

    const validationErrors = validateAgreementTerms(activePartyRoleIds, commitments, notes);
    if (validationErrors.length > 0) {
      const errorMap: Record<string, string> = {};
      validationErrors.forEach((err) => {
        errorMap[err.field] = err.message;
      });
      setErrors(errorMap);
      setSubmitting(false);
      return;
    }

    if (existingAgreement) {
      setErrors({
        general: 'An agreement with this exact group of roles already exists. Propose a revision on that agreement instead.',
      });
      setSubmitting(false);
      return;
    }

    try {
      let result;
      if (agreement) {
        result = await proposeRevision(
          agreement.id,
          commitments,
          notes,
          currentRole.id,
          SESSION_SIGNATURE
        );
      } else {
        result = await createAgreement(
          activePartyRoleIds,
          commitments,
          notes,
          currentRole.id,
          SESSION_SIGNATURE
        );
      }

      if (result.success && result.agreement) {
        if (agreement) {
          updateAgreement(result.agreement);
          toast.success('Revision Proposed!', 'All parties can now review and approve.');
        } else {
          addAgreement(result.agreement);
          toast.success('Agreement Created!', 'Your proposal has been sent.');
        }
        onSubmit(result.agreement);
      } else {
        setErrors({ general: result.error || 'Failed to save agreement' });
      }
    } catch (error: any) {
      setErrors({ general: error?.message || 'An unexpected error occurred' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="font-space-grotesk font-bold text-2xl text-gray-900 dark:text-gray-100">
            {isRevision ? 'Propose Revision' : 'Propose Agreement'}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            {isRevision
              ? 'Update what each party offers and the combined effect.'
              : 'Select one or more roles, describe each offer, and explain how they combine.'}
          </p>
        </div>

        {existingAgreement && (
          <div className="p-4 rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              This group already has an agreement.{' '}
              <a href={`/agreement/${existingAgreement.id}`} className="underline font-medium">
                View existing agreement
              </a>
            </p>
          </div>
        )}

        {errors.general && (
          <div className="p-4 rounded-md bg-danger/10 border border-danger/20">
            <p className="text-sm text-danger font-medium">{errors.general}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isRevision && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Parties ({activePartyRoleIds.length} selected)
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  You are always included. Select any other roles in this game.
                </p>
              </div>
              {errors.parties && (
                <p className="text-sm text-danger">{errors.parties}</p>
              )}
              <div className="space-y-2 max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                {otherRoles.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No other roles in this game yet.
                  </p>
                ) : (
                  otherRoles.map((role) => (
                    <label
                      key={role.id}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCounterpartyIds.includes(role.id)}
                        onChange={() => toggleCounterparty(role.id)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {getRoleDisplayName(role)}
                        <span className="text-gray-500 dark:text-gray-400 ml-2">
                          ({role.template?.archetype ?? 'role'})
                        </span>
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          {isRevision && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Parties</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {activePartyRoleIds
                  .map((id) => {
                    const role = roles.find((r) => r.id === id);
                    return role ? getRoleDisplayName(role) : 'Unknown role';
                  })
                  .join(' · ')}
              </p>
            </div>
          )}

          {activePartyRoleIds.map((roleId) => {
            const role = roles.find((r) => r.id === roleId);
            const name = role ? getRoleDisplayName(role) : 'Unknown role';
            return (
              <Textarea
                key={roleId}
                label={`What ${name} is offering`}
                value={commitments[roleId] ?? ''}
                onChange={(e) => {
                  setCommitments((prev) => ({ ...prev, [roleId]: e.target.value }));
                  if (errors[`commitment-${roleId}`]) {
                    setErrors((prev) => ({ ...prev, [`commitment-${roleId}`]: '' }));
                  }
                }}
                error={errors[`commitment-${roleId}`]}
                placeholder="Resources, capabilities, or commitments this role brings to the deal."
                rows={3}
                required
              />
            );
          })}

          <Textarea
            label="Combined effect"
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              if (errors.notes) setErrors((prev) => ({ ...prev, notes: '' }));
            }}
            error={errors.notes}
            placeholder="Describe what happens when all offers are fulfilled — the shared outcome, synergy, or combined impact on the network."
            rows={4}
            required
          />

          <div className="flex flex-col sm:flex-row gap-4 justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting || isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting || isLoading}
              disabled={Boolean(existingAgreement) || (!isRevision && selectedCounterpartyIds.length === 0)}
            >
              {isRevision ? 'Propose Revision' : 'Propose Agreement'}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}
