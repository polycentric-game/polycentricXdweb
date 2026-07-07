'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { roleStorage } from '@/lib/storage';
import { findDemoRole, getDemoGameData, isDemoGame } from '@/lib/demoGame';
import { Role, getRoleDisplayName, getRoleSubtitle, getArchetypeForRole } from '@/lib/types';
import { getArchetypeLabel } from '@/lib/roleTemplates';
import { gameNetworkPath } from '@/lib/gameRoutes';
import { getAgreementDisplayNumber } from '@/lib/utils';
import { getPartyRoleIds, isRoleInAgreement } from '@/lib/agreementHelpers';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/LoadingSpinner';
import { FounderGraph } from '@/components/graph/FounderGraph';

interface FounderPageProps {
  params: { id: string };
}

export default function FounderPage({ params }: FounderPageProps) {
  const router = useRouter();
  const { session, currentGame, currentRole, agreements, roles } = useAppStore();
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      router.push('/');
      return;
    }

    const fromStore =
      findDemoRole(roles, params.id) ??
      (params.id.startsWith('demo-role-') ? findDemoRole(getDemoGameData().roles, params.id) : undefined);
    if (fromStore || isDemoGame(currentGame) || params.id.startsWith('demo-role-')) {
      setRole(fromStore ?? null);
      setLoading(false);
      return;
    }

    roleStorage.findById(params.id).then((found) => {
      setRole(found);
      setLoading(false);
    });
  }, [params.id, session, router, roles, currentGame]);

  if (!session) {
    return null;
  }

  if (loading) {
    return <LoadingState message="Loading role profile..." />;
  }

  if (!role) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Role Not Found</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          The role profile you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button
          onClick={() =>
            router.push(currentGame ? gameNetworkPath(currentGame.id) : '/games')
          }
        >
          Back to Network
        </Button>
      </div>
    );
  }

  const isOwnProfile = currentRole?.id === role.id;
  const template = role.template;
  const roleAgreements = agreements.filter((a) => isRoleInAgreement(a, role.id));
  const archetype = getArchetypeForRole(role);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-space-grotesk font-bold text-3xl text-gray-900 dark:text-gray-100">
            {getRoleDisplayName(role)}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            {template?.name}
            {getRoleSubtitle(role) ? ` · ${getRoleSubtitle(role)}` : ''}
          </p>
          {archetype && (
            <Badge variant="secondary" className="mt-2">
              {getArchetypeLabel(archetype)}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {!isOwnProfile && currentRole && (
            <Button onClick={() => router.push(`/game/propose?with=${role.id}`)}>
              Propose Agreement
            </Button>
          )}
          {isOwnProfile && (
            <Button variant="secondary" onClick={() => router.push(`/founder/${role.id}/edit`)}>
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {template && (
        <>
          <Card>
            <div className="space-y-4">
              <h2 className="font-semibold text-xl text-gray-900 dark:text-gray-100">Backstory</h2>
              <p className="text-gray-900 dark:text-gray-100">{template.backstory}</p>
              {template.expandedBackstory && (
                <p className="text-gray-600 dark:text-gray-300">{template.expandedBackstory}</p>
              )}
            </div>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-4">Values</h3>
              <div className="flex flex-wrap gap-2">
                {template.values.map((value, index) => (
                  <Badge key={index} variant="secondary">
                    {value}
                  </Badge>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-4">Goals</h3>
              <div className="space-y-2">
                {template.goals.map((goal, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-gray-900 dark:text-gray-100">{goal}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-4">
                Capabilities
              </h3>
              <div className="space-y-2">
                {template.capabilities.map((cap, index) => (
                  <div key={index} className="text-gray-900 dark:text-gray-100">
                    {cap}
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-4">
                Rivalrous Resources
              </h3>
              <div className="flex flex-wrap gap-2">
                {template.rivalrousResources.map((resource, index) => (
                  <Badge key={index} variant="secondary">
                    {resource}
                  </Badge>
                ))}
              </div>
            </Card>
          </div>

          <Card>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-4">
              Obligations
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {template.obligations.map((obligation, index) => (
                <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-900 dark:text-gray-100">{obligation}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      <Card>
        <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-4">
          Network Connections
        </h3>
        <div className="h-80">
          <FounderGraph role={role} roles={roles} agreements={agreements} />
        </div>
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Click on connected roles to view their profiles, or click on edges to view agreements.
        </div>
      </Card>

      {roleAgreements.length > 0 && (
        <Card>
          <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-4">
            Agreements ({roleAgreements.length})
          </h3>
          <div className="space-y-3">
            {roleAgreements.map((agreement) => (
              <div
                key={agreement.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => router.push(`/agreement/${agreement.id}`)}
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    Agreement {getAgreementDisplayNumber(agreement, agreements)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Status: {agreement.status}
                  </div>
                </div>
                <Badge variant={agreement.status === 'approved' ? 'default' : 'secondary'}>
                  {agreement.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
