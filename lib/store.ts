import { create } from 'zustand';
import { User, Role, Agreement, AuthSession, Theme, Game } from './types';
import { getAuthSessionAndUser } from './auth';
import { gameStorage, roleStorage, agreementStorage, themeStorage } from './storage';
import { initializeSampleData } from './sampleData';
import { loadGameData } from './games';
import { clearStoredGameId, getStoredGameId, setStoredGameId } from './gameContext';
import {
  DEMO_GAME,
  getDemoGameData,
  isDemoGame,
  mergeGamesWithDemo,
} from './demoGame';

interface AppState {
  session: AuthSession | null;
  user: User | null;
  currentGame: Game | null;
  currentRole: Role | null;
  theme: Theme;
  games: Game[];
  roles: Role[];
  agreements: Agreement[];
  isLoading: boolean;
  initializeApp: () => void;
  setSession: (session: AuthSession | null, user: User | null) => void;
  clearSession: () => void;
  setCurrentGame: (game: Game | null) => Promise<void>;
  setCurrentRole: (role: Role | null) => Promise<void>;
  enterGame: (game: Game, role: Role) => Promise<void>;
  switchGame: (game: Game) => Promise<void>;
  leaveGame: () => void;
  setTheme: (theme: Theme) => void;
  refreshGames: () => Promise<void>;
  refreshGameData: (gameId?: string) => Promise<void>;
  refreshData: (gameId?: string) => Promise<void>;
  addRole: (role: Role) => Promise<Role>;
  updateRole: (role: Role) => void;
  addAgreement: (agreement: Agreement) => void;
  updateAgreement: (agreement: Agreement) => void;
}

async function restoreGameContext(userId: string): Promise<{
  game: Game | null;
  role: Role | null;
}> {
  const storedGameId = getStoredGameId();
  if (!storedGameId) return { game: null, role: null };

  if (isDemoGame(storedGameId)) {
    return { game: DEMO_GAME, role: null };
  }

  const game = await gameStorage.findById(storedGameId);
  if (!game) {
    clearStoredGameId();
    return { game: null, role: null };
  }

  const role = await roleStorage.findByGameAndUser(storedGameId, userId);
  return { game, role };
}

async function loadRolesAndAgreementsForGame(game: Game): Promise<{
  roles: Role[];
  agreements: Agreement[];
}> {
  if (isDemoGame(game)) {
    const { roles, agreements } = getDemoGameData();
    return { roles, agreements };
  }
  return loadGameData(game.id);
}

export const useAppStore = create<AppState>((set, get) => ({
  session: null,
  user: null,
  currentGame: null,
  currentRole: null,
  theme: 'light',
  games: [],
  roles: [],
  agreements: [],
  isLoading: true,

  initializeApp: async () => {
    try {
      const theme = themeStorage.get();
      let games: Game[] = [];

      const authPromise = getAuthSessionAndUser();

      try {
        games = mergeGamesWithDemo(await gameStorage.getAll());
        await initializeSampleData();
        games = mergeGamesWithDemo(await gameStorage.getAll());
      } catch (dbError: any) {
        if (dbError?.code === 'PGRST205' || dbError?.message?.includes('Could not find the table')) {
          console.warn('Database tables not found. Please run the migration:', dbError.message);
        } else {
          console.warn('Failed to load games:', dbError?.message ?? dbError);
        }
        games = mergeGamesWithDemo([]);
      }

      const { session: storeSession, user: storeUser } = get();
      const { session: authSession, user: authUser } = await authPromise;

      const session = authSession ?? storeSession;
      const user = authUser ?? storeUser;

      let currentGame: Game | null = null;
      let currentRole: Role | null = null;
      let roles: Role[] = [];
      let agreements: Agreement[] = [];

      if (user) {
        try {
          const restored = await restoreGameContext(user.id);
          currentGame = restored.game;
          currentRole = restored.role;

          if (currentGame) {
            const data = await loadRolesAndAgreementsForGame(currentGame);
            roles = data.roles;
            agreements = data.agreements;
          }
        } catch (err) {
          console.warn('Failed to restore game context:', err);
        }
      }

      set({
        session,
        user,
        currentGame,
        currentRole,
        games,
        roles,
        agreements,
        theme,
        isLoading: false,
      });

      if (typeof window !== 'undefined') {
        document.documentElement.classList.toggle('dark', theme === 'dark');
      }
    } catch (error) {
      console.error('Failed to initialize app:', error);
      set({ isLoading: false });
    }
  },

  setSession: async (session, user) => {
    if (session && user) {
      set({ session, user });

      try {
        const restored = await restoreGameContext(user.id);
        let roles: Role[] = [];
        let agreements: Agreement[] = [];
        if (restored.game) {
          const data = await loadRolesAndAgreementsForGame(restored.game);
          roles = data.roles;
          agreements = data.agreements;
        }
        set({
          currentGame: restored.game,
          currentRole: restored.role,
          roles,
          agreements,
        });
      } catch (err) {
        console.warn('Failed to restore game context:', err);
      }
    } else {
      set({ session, user, currentGame: null, currentRole: null, roles: [], agreements: [] });
    }
  },

  clearSession: () => {
    clearStoredGameId();
    set({
      session: null,
      user: null,
      currentGame: null,
      currentRole: null,
      roles: [],
      agreements: [],
    });
  },

  setCurrentGame: async (game) => {
    if (game) {
      setStoredGameId(game.id);
      const { roles, agreements } = await loadRolesAndAgreementsForGame(game);
      set({ currentGame: game, roles, agreements, currentRole: null });
    } else {
      clearStoredGameId();
      set({ currentGame: null, currentRole: null, roles: [], agreements: [] });
    }
  },

  setCurrentRole: async (role) => {
    set({ currentRole: role });
  },

  enterGame: async (game, role) => {
    if (isDemoGame(game)) return;
    setStoredGameId(game.id);
    const { roles, agreements } = await loadGameData(game.id);
    set({ currentGame: game, currentRole: role, roles, agreements });
  },

  switchGame: async (game) => {
    setStoredGameId(game.id);
    if (isDemoGame(game)) {
      const { roles, agreements } = getDemoGameData();
      set({ currentGame: game, currentRole: null, roles, agreements });
      return;
    }
    const userId = get().user?.id;
    let currentRole: Role | null = null;
    if (userId) {
      currentRole = await roleStorage.findByGameAndUser(game.id, userId);
    }
    const { roles, agreements } = await loadGameData(game.id);
    set({ currentGame: game, currentRole, roles, agreements });
  },

  leaveGame: () => {
    clearStoredGameId();
    set({ currentGame: null, currentRole: null, roles: [], agreements: [] });
  },

  setTheme: (theme) => {
    themeStorage.save(theme);
    set({ theme });
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  },

  refreshGames: async () => {
    try {
      const games = mergeGamesWithDemo(await gameStorage.getAll());
      set({ games });
    } catch (error) {
      console.error('Failed to refresh games:', error);
      set({ games: mergeGamesWithDemo([]) });
    }
  },

  refreshGameData: async (gameId) => {
    const id = gameId ?? get().currentGame?.id;
    if (!id) return;
    try {
      const game = get().currentGame ?? (isDemoGame(id) ? DEMO_GAME : await gameStorage.findById(id));
      if (!game) return;
      const { roles, agreements } = await loadRolesAndAgreementsForGame(game);
      set({ roles, agreements });
    } catch (error) {
      console.error('Failed to refresh game data:', error);
    }
  },

  refreshData: async (gameId) => {
    await get().refreshGameData(gameId);
  },

  addRole: async (role) => {
    const savedRole = await roleStorage.save(role);
    set({ roles: [...get().roles, savedRole] });
    return savedRole;
  },

  updateRole: async (role) => {
    const updatedRole = await roleStorage.save(role);
    set({ roles: get().roles.map((r) => (r.id === role.id ? updatedRole : r)) });
  },

  addAgreement: async (agreement) => {
    const savedAgreement = await agreementStorage.save(agreement);
    set({ agreements: [...get().agreements, savedAgreement] });
  },

  updateAgreement: async (agreement) => {
    const updatedAgreement = await agreementStorage.save(agreement);
    set({
      agreements: get().agreements.map((a) => (a.id === agreement.id ? updatedAgreement : a)),
    });
  },
}));
