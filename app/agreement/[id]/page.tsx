'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { agreementStorage } from '@/lib/storage';
import { findDemoAgreement, getDemoGameData, isDemoGame } from '@/lib/demoGame';
import {
  canApproveAgreement,
  canReviseAgreement,
  approveAgreement,
} from '@/lib/agreements';
import { toast } from '@/lib/toastStore';
import { Agreement, getRoleDisplayName } from '@/lib/types';
import { getCommitment, getPartyRoleIds, isRoleInAgreement, partyCount } from '@/lib/agreementHelpers';
import { getAgreementDisplayNumber } from '@/lib/utils';
import { AgreementForm } from '@/components/agreement/AgreementForm';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { LoadingState } from '@/components/ui/LoadingSpinner';

interface AgreementPageProps {
  params: { id: string };
}

const SESSION_SIGNATURE = 'email-session-v1';

export default function AgreementPage({ params }: AgreementPageProps) {
  const router = useRouter();
  const { session, currentGame, currentRole, roles, agreements, updateAgreement, refreshData } =
    useAppStore();
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }

    const fromStore =
      findDemoAgreement(agreements, params.id) ??
      (params.id.startsWith('demo-a-') ? findDemoAgreement(getDemoGameData().agreements, params.id) : undefined);
    if (fromStore || isDemoGame(currentGame) || params.id.startsWith('demo-a-')) {
      setAgreement(fromStore ?? null);
      setLoading(false);
      return;
    }

    agreementStorage.findById(params.id).then((found) => {
      setAgreement(found);
      setLoading(false);
    });
  }, [params.id, session, router, agreements, currentGame]);

  useEffect(() => {
    if (isDemoGame(currentGame)) {
      setAgreement(findDemoAgreement(agreements, params.id) ?? null);
      return;
    }
    agreementStorage.findById(params.id).then(setAgreement);
  }, [params.id, updateAgreement, agreements, currentGame]);

  if (!session) {
    return null;
  }

  if (loading) {
    return <LoadingState message="Loading agreement..." />;
  }

  if (!agreement) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Agreement Not Found
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          The agreement you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button onClick={() => router.push('/agreements')}>Back to Agreements</Button>
      </div>
    );
  }

  const partyRoleIds = getPartyRoleIds(agreement);
  const currentVersion = agreement.versions[agreement.currentVersion];
  const isInvolved = currentRole ? isRoleInAgreement(agreement, currentRole.id) : false;
  const totalParties = partyCount(agreement);

  const handleApprove = async () => {
    if (!agreement || !currentRole) {
      toast.error('Error', 'You need an active role in a game to approve agreements');
      return;
    }

    setActionLoading('approve');

    try {
      const result = await approveAgreement(agreement.id, currentRole.id, SESSION_SIGNATURE);
      if (result.success && result.agreement) {
        updateAgreement(result.agreement);
        refreshData();
        setAgreement(result.agreement);
        toast.success(
          result.agreement.status === 'approved' ? 'Fully approved' : 'Approved',
          result.agreement.status === 'approved'
            ? 'All parties have approved this agreement.'
            : 'Your approval has been recorded.'
        );
      } else {
        toast.error('Approval Failed', result.error || 'Failed to approve agreement');
      }
    } catch (error: any) {
      toast.error('Error', error?.message || 'An unexpected error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const canApprove =
    !isDemoGame(currentGame) && currentRole ? canApproveAgreement(agreement, currentRole.id) : false;
  const canRevise =
    !isDemoGame(currentGame) && currentRole ? canReviseAgreement(agreement, currentRole.id) : false;
  const isDemo = isDemoGame(currentGame);

  const getProposerName = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    return role ? getRoleDisplayName(role) : 'Unknown';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {isDemo && (
        <Card className="p-4 border-primary/30 bg-primary/5">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            View-only demo agreement — actions are disabled.
          </p>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-space-grotesk font-bold text-3xl text-gray-900 dark:text-gray-100">
            Agreement {getAgreementDisplayNumber(agreement, agreements)}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Version {agreement.currentVersion + 1} of {agreement.versions.length} · {totalParties}{' '}
            {totalParties === 1 ? 'party' : 'parties'}
          </p>
        </div>
        <Badge variant={agreement.status === 'approved' ? 'success' : 'secondary'}>
          {agreement.status}
        </Badge>
      </div>

      <Card>
        <div className="space-y-6">
          <h2 className="font-semibold text-xl text-gray-900 dark:text-gray-100">Current Terms</h2>

          <div className="grid md:grid-cols-2 gap-8">
            {partyRoleIds.map((roleId) => {
              const partyRole = roles.find((r) => r.id === roleId);
              return (
                <div key={roleId} className="space-y-4">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                    {partyRole ? getRoleDisplayName(partyRole) : 'Unknown role'}
                  </h3>
                  {partyRole?.template?.name && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {partyRole.template.name}
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Offering</div>
                    <div className="text-gray-900 dark:text-gray-100">
                      {currentVersion ? getCommitment(currentVersion, roleId) : '—'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {currentVersion?.notes && (
            <div className="space-y-2">
              <div className="text-sm text-gray-500 dark:text-gray-400">Combined effect</div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-gray-900 dark:text-gray-100">{currentVersion.notes}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div className="space-y-4">
          <h2 className="font-semibold text-xl text-gray-900 dark:text-gray-100">
            Agreement History
          </h2>

          <div className="space-y-4">
            {agreement.versions.map((version, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  index === agreement.currentVersion
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    Version {version.versionNumber + 1}
                    {index === agreement.currentVersion && (
                      <Badge variant="default" className="ml-2">
                        Current
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(version.proposedAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  {partyRoleIds.map((roleId) => {
                    const partyRole = roles.find((r) => r.id === roleId);
                    return (
                      <div key={roleId}>
                        <span className="text-gray-500 dark:text-gray-400">
                          {partyRole ? getRoleDisplayName(partyRole) : 'Unknown'}:{' '}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {getCommitment(version, roleId)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Notes & Rationale:
                  </div>
                  <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                    {version.notes || '(No notes provided)'}
                  </div>
                </div>

                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Proposed by: {getProposerName(version.proposedBy)} • Approved by:{' '}
                  {version.approvedBy.length} of {totalParties} parties
                  {version.signatures && (
                    <span>
                      {' '}
                      • Signed by: {Object.keys(version.signatures).length} of {totalParties} parties
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button variant="secondary" onClick={() => router.push('/agreements')}>
            Back to Agreements
          </Button>

          {canApprove && isInvolved && (
            <Button onClick={handleApprove} loading={actionLoading === 'approve'}>
              Approve Current Version
            </Button>
          )}

          {canRevise && isInvolved && (
            <Button variant="secondary" onClick={() => setShowRevisionModal(true)}>
              Propose Revision
            </Button>
          )}

          {!currentRole && !isDemo && (
            <div className="text-sm text-gray-500 dark:text-gray-400 italic">
              Sign in is complete. Join or create a game and claim a role to take actions on
              agreements.
            </div>
          )}

          {currentRole && !isInvolved && (
            <div className="text-sm text-gray-500 dark:text-gray-400 italic">
              You can view this agreement but cannot take actions as you are not involved in it.
            </div>
          )}
        </div>
      </Card>

      <Modal
        isOpen={showRevisionModal}
        onClose={() => setShowRevisionModal(false)}
        title="Propose Revision"
        size="lg"
      >
        <AgreementForm
          agreement={agreement}
          onSubmit={(updated) => {
            setShowRevisionModal(false);
            updateAgreement(updated);
            setAgreement(updated);
          }}
          onCancel={() => setShowRevisionModal(false)}
        />
      </Modal>
    </div>
  );
}
