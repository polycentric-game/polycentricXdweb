'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { roleTemplateStorage } from '@/lib/storage';
import { RoleBrowser, RoleTemplateWithId } from '@/components/role/RoleBrowser';
import { ROLE_TEMPLATES } from '@/lib/roleTemplates';
import { Card } from '@/components/ui/Card';

const LOCAL_TEMPLATES: RoleTemplateWithId[] = ROLE_TEMPLATES.map((t, i) => ({
  ...t,
  id: `local-${t.slug}`,
  sortOrder: i + 1,
}));

/** Browse role deck only — claiming happens within a game (future). */
export default function ClaimRolePage() {
  const { session, user, roles, isLoading: appIsLoading } = useAppStore();
  const [templates, setTemplates] = useState<RoleTemplateWithId[]>(LOCAL_TEMPLATES);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  useEffect(() => {
    roleTemplateStorage
      .getAll()
      .then((loaded) => {
        if (loaded.length > 0) setTemplates(loaded);
      })
      .catch(console.error)
      .finally(() => setLoadingTemplates(false));
  }, []);

  const claimedTemplateIds = new Set(
    roles.flatMap((r) => [r.templateId, r.template?.slug].filter(Boolean) as string[])
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {session && user && (
        <Card className="bg-primary/5 border-primary/20">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Signed in as <strong>{user.email}</strong>.{' '}
            <Link href="/games" className="text-primary hover:underline">
              Create or join a game
            </Link>{' '}
            to claim a role.
          </p>
        </Card>
      )}

      {!session && (
        <Card className="bg-gray-50 dark:bg-gray-800/50">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>{' '}
            to save your progress when games launch. You can browse all roles below without an
            account.
          </p>
        </Card>
      )}

      <RoleBrowser
        templates={templates}
        claimedTemplateIds={claimedTemplateIds}
        isLoadingTemplates={loadingTemplates && appIsLoading}
        browseOnly
      />
    </div>
  );
}
