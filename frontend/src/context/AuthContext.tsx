import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';
import type { ReactNode } from 'react';
import type { User } from '@/types/user';
import {
  fetchCurrentUser,
  login as loginRequest,
  register as registerRequest,
  updateProfile as updateProfileRequest,
  deleteProfile as deleteProfileRequest,
  RegisterPayload
} from '@/api/auth';
import {
  clearAuthToken,
  setAuthToken
} from '@/api/client';

const AUTH_TOKEN_STORAGE_KEY = 'umanni_frontend_token';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => void;
  refreshCurrentUser: () => Promise<User | null>;
  updateProfile: (payload: {
    full_name?: string;
    email?: string;
    password?: string;
    avatarFile?: File | null;
    avatarUrl?: string;
  }) => Promise<User>;
  deleteAccount: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initialise = async () => {
      const storedToken = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        setAuthToken(storedToken);
        setToken(storedToken);
        const currentUser = await fetchCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Failed to restore session', error);
        handleClearSession();
      } finally {
        setIsLoading(false);
      }
    };

    void initialise();
  }, []);

  const persistToken = useCallback((value: string) => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, value);
    setAuthToken(value);
    setToken(value);
  }, []);

  const handleClearSession = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    clearAuthToken();
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const newToken = await loginRequest({ email, password });
      persistToken(newToken);
      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
      return currentUser;
    },
    [persistToken]
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const { token: newToken } = await registerRequest(payload);
      persistToken(newToken);
      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
      return currentUser;
    },
    [persistToken]
  );

  const logout = useCallback(() => {
    handleClearSession();
  }, [handleClearSession]);

  const refreshCurrentUser = useCallback(async () => {
    if (!token) return null;

    try {
      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      console.error('Failed to refresh current user', error);
      handleClearSession();
      return null;
    }
  }, [token, handleClearSession]);

  const updateProfile = useCallback(
    async (payload: {
      full_name?: string;
      email?: string;
      password?: string;
      avatarFile?: File | null;
      avatarUrl?: string;
    }) => {
      const updatedUser = await updateProfileRequest(payload);
      setUser(updatedUser);
      return updatedUser;
    },
    []
  );

  const deleteAccount = useCallback(async () => {
    await deleteProfileRequest();
    handleClearSession();
  }, [handleClearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
      refreshCurrentUser,
      updateProfile,
      deleteAccount
    }),
    [
      deleteAccount,
      isLoading,
      login,
      logout,
      refreshCurrentUser,
      register,
      token,
      updateProfile,
      user
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

