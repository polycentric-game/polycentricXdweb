import { Role, Agreement, User, Game } from './types';
import {
  roleStorage,
  roleTemplateStorage,
  agreementStorage,
  userStorage,
  gameStorage,
  generateId,
  generateAgreementId,
} from './storage';

const SAMPLE_ROLE_SLUGS = [
  'protocol-architect',
  'community-organizer',
  'patient-protocol-backer',
];

const DEMO_GAME_TITLE = 'Demo Network';

export async function initializeSampleData(): Promise<void> {
  const existingGames = await gameStorage.getAll();
  const demoGame = existingGames.find((g) => g.title === DEMO_GAME_TITLE);

  if (demoGame) {
    const demoRoles = await roleStorage.getByGameId(demoGame.id);
    if (demoRoles.length > 0) return;
  }

  const existingRoles = await roleStorage.getAll();
  const existingAgreements = await agreementStorage.getAll();

  if (existingRoles.length > 0 || existingAgreements.length > 0) {
    return;
  }

  const templates = await roleTemplateStorage.getAll();
  const sampleTemplates = SAMPLE_ROLE_SLUGS.map((slug) =>
    templates.find((t) => t.slug === slug)
  ).filter(Boolean) as (typeof templates)[number][];

  if (sampleTemplates.length < 2) return;

  const sampleUsers: User[] = [];
  for (let i = 0; i < sampleTemplates.length; i++) {
    const user: User = {
      id: generateId(),
      email: `demo-player-${i + 1}@example.com`,
      createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    };
    sampleUsers.push(await userStorage.save(user));
  }

  const now = new Date().toISOString();
  const demoGameRecord: Game = await gameStorage.save({
    id: generateId(),
    title: DEMO_GAME_TITLE,
    createdBy: sampleUsers[0].id,
    createdAt: now,
    updatedAt: now,
  });

  const sampleRoles: Role[] = [];
  for (let i = 0; i < sampleTemplates.length; i++) {
    const template = sampleTemplates[i];
    const roleNow = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString();
    const role: Role = {
      id: generateId(),
      userId: sampleUsers[i].id,
      gameId: demoGameRecord.id,
      templateId: template.id,
      createdAt: roleNow,
      updatedAt: roleNow,
    };
    sampleRoles.push(await roleStorage.save(role));
  }

  if (sampleRoles.length >= 2) {
    const agreementId = await generateAgreementId();
    const agreement: Agreement = {
      id: agreementId,
      partyRoleIds: [sampleRoles[0].id, sampleRoles[1].id],
      status: 'proposed',
      initiatedBy: sampleRoles[0].id,
      lastRevisedBy: sampleRoles[0].id,
      currentVersion: 0,
      versions: [
        {
          versionNumber: 0,
          commitments: {
            [sampleRoles[0].id]:
              'Provide interoperability standards and reference implementation support.',
            [sampleRoles[1].id]:
              'Mobilize community adoption and onboarding for the shared protocol layer.',
          },
          notes:
            'Combine technical standards work with grassroots adoption to prevent ecosystem fragmentation.',
          proposedBy: sampleRoles[0].id,
          proposedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          approvedBy: [sampleRoles[0].id],
        },
      ],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    };
    await agreementStorage.save(agreement);
  }

  console.log('Sample data initialized with demo game and', sampleRoles.length, 'roles');
}
