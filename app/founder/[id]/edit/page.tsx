'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { roleStorage } from '@/lib/storage';
import { Role, getRoleDisplayName } from '@/lib/types';
import { gameNetworkPath } from '@/lib/gameRoutes';
import { validateRoleSelection } from '@/lib/validation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingSpinner';

interface EditFounderPageProps {
  params: { id: string };
}

export default function EditFounderPage({ params }: EditFounderPageProps) {
  const router = useRouter();
  const { session, user, currentGame, currentRole, updateRole, setCurrentRole, refreshData } = useAppStore();
  const [role, setRole] = useState<Role | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session) {
      router.push('/');
      return;
    }

    const loadRole = async () => {
      try {
        const foundRole = await roleStorage.findById(params.id);
        if (!foundRole) {
          router.push(currentGame ? gameNetworkPath(currentGame.id) : '/games');
          return;
        }

        if (!user || foundRole.userId !== user.id || currentRole?.id !== foundRole.id) {
          router.push(`/founder/${params.id}`);
          return;
        }

        setRole(foundRole);
        setPlayerName(foundRole.playerName ?? '');
      } catch (err) {
        console.error('Failed to load role:', err);
        router.push(`/founder/${params.id}`);
      } finally {
        setLoading(false);
      }
    };

    loadRole();
  }, [params.id, session, user, router, currentRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;

    const validationErrors = validateRoleSelection(role.templateId, playerName);
    if (validationErrors.length > 0) {
      setError(validationErrors[0].message);
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const updatedRole: Role = {
        ...role,
        playerName: playerName.trim() || undefined,
        updatedAt: new Date().toISOString(),
      };

      await updateRole(updatedRole);
      await setCurrentRole(updatedRole);
      await refreshData();
      router.push(`/founder/${role.id}`);
    } catch (err) {
      console.error('Failed to update role:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

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
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-space-grotesk font-bold text-3xl text-gray-900 dark:text-gray-100">
          Edit Profile
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Role: {role.template?.name ?? 'Unknown'} ({getRoleDisplayName(role)})
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Display name (optional)"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            error={error}
            placeholder="Your in-game name"
          />

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Your role template cannot be changed after claiming. Only your display name is editable.
          </p>

          <div className="flex gap-4 justify-end">
            <Button type="button" variant="secondary" onClick={() => router.push(`/founder/${role.id}`)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSaving}>
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
