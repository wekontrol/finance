const API_BASE = '/api';

async function handleResponse(response: Response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
}

export const authApi = {
  login: async (username: string, password: string) => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });
    return handleResponse(response);
  },

  register: async (data: { username: string; password: string; name: string; familyName: string; securityQuestion?: string; securityAnswer?: string }) => {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  logout: async () => {
    const response = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    return handleResponse(response);
  },

  me: async () => {
    const response = await fetch(`${API_BASE}/auth/me`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },

  recoverPassword: async (username: string, securityAnswer: string, newPassword: string) => {
    const response = await fetch(`${API_BASE}/auth/recover-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, securityAnswer, newPassword })
    });
    return handleResponse(response);
  }
};

export const transactionsApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE}/transactions`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },

  create: async (data: any) => {
    const response = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  update: async (id: string, data: any) => {
    const response = await fetch(`${API_BASE}/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_BASE}/transactions/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    return handleResponse(response);
  }
};

export const budgetApi = {
  getLimits: async () => {
    const response = await fetch(`${API_BASE}/budget/limits`, { credentials: 'include' });
    return handleResponse(response);
  },
  
  saveBudget: async (data: any) => {
    const response = await fetch(`${API_BASE}/budget/limits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  setLimit: async (category: string, limit: number) => {
    const response = await fetch(`${API_BASE}/budget/limits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ category, limit })
    });
    return handleResponse(response);
  },

  deleteLimit: async (category: string) => {
    const response = await fetch(`${API_BASE}/budget/limits/${category}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    return handleResponse(response);
  },

  getHistory: async () => {
    const response = await fetch(`${API_BASE}/budget/history`, { credentials: 'include' });
    return handleResponse(response);
  },

  saveHistory: async () => {
    const response = await fetch(`${API_BASE}/budget/history/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({})
    });
    return handleResponse(response);
  },

  reset: async () => {
    const response = await fetch(`${API_BASE}/budget/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({})
    });
    return handleResponse(response);
  }
};

export const goalsApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE}/goals`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },

  create: async (data: any) => {
    const response = await fetch(`${API_BASE}/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  contribute: async (id: string, amount: number, note?: string) => {
    const response = await fetch(`${API_BASE}/goals/${id}/contribute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ amount, note })
    });
    return handleResponse(response);
  },

  update: async (id: string, data: any) => {
    const response = await fetch(`${API_BASE}/goals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_BASE}/goals/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    return handleResponse(response);
  }
};

export const usersApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE}/users`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },

  create: async (data: any) => {
    const response = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  update: async (id: string, data: any) => {
    const response = await fetch(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_BASE}/users/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    return handleResponse(response);
  }
};

export const familyApi = {
  getTasks: async () => {
    const response = await fetch(`${API_BASE}/family/tasks`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },

  createTask: async (data: any) => {
    const response = await fetch(`${API_BASE}/family/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  updateTask: async (id: string, data: any) => {
    const response = await fetch(`${API_BASE}/family/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  deleteTask: async (id: string) => {
    const response = await fetch(`${API_BASE}/family/tasks/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    return handleResponse(response);
  },

  getEvents: async () => {
    const response = await fetch(`${API_BASE}/family/events`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },

  createEvent: async (data: any) => {
    const response = await fetch(`${API_BASE}/family/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  deleteEvent: async (id: string) => {
    const response = await fetch(`${API_BASE}/family/events/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    return handleResponse(response);
  }
};

export const settingsApi = {
  getSetting: async (key: string) => {
    const response = await fetch(`${API_BASE}/settings/${key}`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },

  setSetting: async (key: string, value: string) => {
    const response = await fetch(`${API_BASE}/settings/${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ value })
    });
    return handleResponse(response);
  },

  // New methods for API configurations table
  getApiConfig: async (provider: string) => {
    const response = await fetch(`${API_BASE}/settings/api-config/${provider}`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },

  saveApiConfig: async (provider: string, apiKey: string, model?: string) => {
    const response = await fetch(`${API_BASE}/settings/api-configs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ provider, apiKey, model })
    });
    return handleResponse(response);
  },

  deleteApiConfig: async (provider: string) => {
    const response = await fetch(`${API_BASE}/settings/api-config/${provider}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    return handleResponse(response);
  }
};

export const familiesApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE}/families`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_BASE}/families/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    return handleResponse(response);
  }
};
