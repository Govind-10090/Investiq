export interface MockDB {
  watchlists: Record<string, any[]>;
  holdings: Record<string, any[]>;
  transactions: Record<string, any[]>;
  alerts: Record<string, any[]>;
  settings: Record<string, any>;
  notes: Record<string, any[]>;
  marketAssets: any[];
}

const MOCK_USERS_KEY = "investiq_mock_users";
const MOCK_CURRENT_USER_KEY = "investiq_mock_current_user";
const MOCK_DB_KEY = "investiq_mock_db";

export const getMockDB = (): MockDB => {
  const data = localStorage.getItem(MOCK_DB_KEY);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      return {
        watchlists: parsed.watchlists || {},
        holdings: parsed.holdings || {},
        transactions: parsed.transactions || {},
        alerts: parsed.alerts || {},
        settings: parsed.settings || {},
        notes: parsed.notes || {},
        marketAssets: parsed.marketAssets || [],
      };
    } catch (e) {
      // Ignored
    }
  }
  return { watchlists: {}, holdings: {}, transactions: {}, alerts: {}, settings: {}, notes: {}, marketAssets: [] };
};

export const saveMockDB = (db: MockDB) => {
  localStorage.setItem(MOCK_DB_KEY, JSON.stringify(db));
};

export const getMockUsers = (): Record<string, { email: string; password?: string; displayName: string }> => {
  const users = localStorage.getItem(MOCK_USERS_KEY);
  return users ? JSON.parse(users) : {
    "investor@example.com": { email: "investor@example.com", password: "password123", displayName: "Retail Investor" }
  };
};

export const saveMockUsers = (users: any) => {
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
};

export const getMockCurrentUser = () => {
  const stored = localStorage.getItem(MOCK_CURRENT_USER_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      return null;
    }
  }
  return null;
};

export const saveMockCurrentUser = (user: any) => {
  localStorage.setItem(MOCK_CURRENT_USER_KEY, JSON.stringify(user));
};

export const removeMockCurrentUser = () => {
  localStorage.removeItem(MOCK_CURRENT_USER_KEY);
};
