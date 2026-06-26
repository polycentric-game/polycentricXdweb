'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { getAgreementDisplayNumber } from '@/lib/utils';
import { getRoleDisplayName } from '@/lib/types';
import { formatPartyList, getCommitment, getPartyRoleIds, isRoleInAgreement } from '@/lib/agreementHelpers';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { isDemoGame } from '@/lib/demoGame';
import { Plus } from 'lucide-react';

export default function AgreementsPage() {
  const router = useRouter();
  const { session, currentGame, currentRole, agreements, roles } = useAppStore();

  useEffect(() => {
    if (!session) {
      router.push('/login');
    }
  }, [session, router]);

  if (!session) {
    return null;
  }

  if (!currentRole && !isDemoGame(currentGame)) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-space-grotesk font-bold text-3xl text-gray-900 dark:text-gray-100">
            My Agreements
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your infrastructure agreements
          </p>
        </div>

        <Card className="p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No active role in a game
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-lg mx-auto">
            Join or create a game and claim a role to start negotiating agreements.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => router.push('/games')}>Go to games</Button>
            <Button variant="secondary" onClick={() => router.push('/claim-role')}>
              Browse role deck
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const isDemo = isDemoGame(currentGame);
  const listedAgreements = isDemo
    ? agreements
    : agreements.filter((a) => isRoleInAgreement(a, currentRole!.id));

  const getPartyLabel = (agreement: (typeof agreements)[number]) => {
    const partyRoleIds = getPartyRoleIds(agreement);
    const others = isDemo
      ? partyRoleIds
      : partyRoleIds.filter((id) => id !== currentRole!.id);
    return formatPartyList(others, (id) => {
      const role = roles.find((r) => r.id === id);
      return role ? getRoleDisplayName(role) : 'Unknown';
    });
  };

  const getMyCommitment = (agreement: (typeof agreements)[number]) => {
    const version = agreement.versions[agreement.currentVersion];
    if (!version) return '';
    if (isDemo) {
      const firstParty = getPartyRoleIds(agreement)[0];
      return getCommitment(version, firstParty);
    }
    return getCommitment(version, currentRole!.id);
  };

  return (
    <div className="space-y-6">
      {isDemo && (
        <Card className="p-4 border-primary/30 bg-primary/5">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            View-only demo — showing all {listedAgreements.length} mock agreements.
          </p>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-space-grotesk font-bold text-3xl text-gray-900 dark:text-gray-100">
            {isDemo ? 'Demo Agreements' : 'My Agreements'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {isDemo
              ? 'Browse mock multilateral agreements in the demo network'
              : 'Manage your infrastructure agreements'}
          </p>
        </div>
        {!isDemo && (
          <Button onClick={() => router.push('/game/propose')} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Create Agreement</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {listedAgreements.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Total Agreements</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">
            {listedAgreements.filter((a) => a.status === 'proposed' || a.status === 'revised').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Pending</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-primary">
            {listedAgreements.filter((a) => a.status === 'approved').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Approved</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {listedAgreements.filter((a) => a.status === 'completed').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Completed</div>
        </Card>
      </div>

      {listedAgreements.length === 0 ? (
        <Card className="p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No agreements yet
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {isDemo ? 'No mock agreements loaded.' : 'Start by creating your first infrastructure agreement'}
          </p>
          {!isDemo && (
            <Button onClick={() => router.push('/game/propose')}>Create Your First Agreement</Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {listedAgreements.map((agreement) => (
            <Card
              key={agreement.id}
              clickable
              onClick={() => router.push(`/agreement/${agreement.id}`)}
              className="p-6"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                      Agreement {getAgreementDisplayNumber(agreement, agreements)}
                    </h3>
                    <Badge variant={agreement.status === 'approved' ? 'success' : 'secondary'}>
                      {agreement.status}
                    </Badge>
                    <Badge variant="secondary">
                      {getPartyRoleIds(agreement).length} parties
                    </Badge>
                  </div>
                  <div className="text-gray-600 dark:text-gray-300">
                    {isDemo ? 'Parties: ' : 'With '}
                    {getPartyLabel(agreement)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    {isDemo ? 'Sample commitment: ' : 'Your offer: '}
                    {getMyCommitment(agreement)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Last updated</div>
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {new Date(agreement.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
