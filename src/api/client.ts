/**
 * CollabFlow Enterprise API Client
 *
 * Full-featured HTTP client with automatic JWT bearer attachment,
 * token refresh with concurrency queueing on 401, typed error handling,
 * health-checking, and endpoints for all CollabFlow resources.
 */

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    status_code: number;
    timestamp: string;
  };
}

export class ApiError extends Error {
  public statusCode: number;
  public code: string;
  public details?: Record<string, any>;

  constructor(message: string, statusCode: number, code: string = 'api_error', details?: Record<string, any>) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

class ApiClient {
  private baseUrl: string;
  private isRefreshing: boolean = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor() {
    this.baseUrl = (import.meta.env.VITE_API_URL as string) || '/api/v1';
    // Trim trailing slash if present
    if (this.baseUrl.endsWith('/')) {
      this.baseUrl = this.baseUrl.slice(0, -1);
    }
  }

  public getAccessToken(): string | null {
    try {
      return localStorage.getItem('collabflow_access_token');
    } catch {
      return null;
    }
  }

  public getRefreshToken(): string | null {
    try {
      return localStorage.getItem('collabflow_refresh_token');
    } catch {
      return null;
    }
  }

  public setTokens(access: string, refresh?: string): void {
    try {
      localStorage.setItem('collabflow_access_token', access);
      if (refresh) {
        localStorage.setItem('collabflow_refresh_token', refresh);
      }
    } catch {
      // Storage unavailable
    }
  }

  public clearTokens(): void {
    try {
      localStorage.removeItem('collabflow_access_token');
      localStorage.removeItem('collabflow_refresh_token');
    } catch {
      // Storage unavailable
    }
  }

  private onRefreshed(token: string): void {
    this.refreshSubscribers.forEach((cb) => cb(token));
    this.refreshSubscribers = [];
  }

  private addRefreshSubscriber(cb: (token: string) => void): void {
    this.refreshSubscribers.push(cb);
  }

  /**
   * Health check to test backend availability
   */
  public async checkHealth(): Promise<{ isHealthy: boolean; latencyMs: number; details?: any }> {
    const rawApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
    if (!rawApiUrl) {
      // When VITE_API_URL is not set, make no network request at all and go straight to Demo mode
      return { isHealthy: false, latencyMs: 0 };
    }

    const start = performance.now();
    try {
      const cleanUrl = rawApiUrl.replace(/\/+$/, '');
      const healthUrl = `${cleanUrl}/health/`;
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(1500),
      });
      const latencyMs = Math.round(performance.now() - start);

      if (response.status === 200) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await response.json();
          if (data && data.status === 'healthy') {
            return { isHealthy: true, latencyMs, details: data };
          }
        }
      }
      return { isHealthy: false, latencyMs };
    } catch {
      return { isHealthy: false, latencyMs: 0 };
    }
  }

  /**
   * Core HTTP request handler
   */
  public async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
    requiresAuth: boolean = true
  ): Promise<T> {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    if (requiresAuth) {
      const token = this.getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    let response: Response;
    try {
      response = await fetch(url, { ...options, headers });
    } catch (err: any) {
      throw new ApiError(
        `Network error: ${err.message || 'Unable to connect to CollabFlow API server.'}`,
        0,
        'network_unavailable'
      );
    }

    // Handle token refresh on 401
    if (response.status === 401 && requiresAuth && !endpoint.includes('/accounts/login') && !endpoint.includes('/accounts/token/refresh')) {
      if (!this.isRefreshing) {
        this.isRefreshing = true;
        const refreshToken = this.getRefreshToken();

        if (refreshToken) {
          try {
            const refreshRes = await fetch(`${this.baseUrl}/accounts/token/refresh/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh: refreshToken }),
            });

            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              const newAccess = refreshData.access;
              const newRefresh = refreshData.refresh || refreshToken;
              this.setTokens(newAccess, newRefresh);
              this.isRefreshing = false;
              this.onRefreshed(newAccess);

              // Retry original request
              headers['Authorization'] = `Bearer ${newAccess}`;
              const retryRes = await fetch(url, { ...options, headers });
              return this.handleResponse<T>(retryRes);
            } else {
              this.clearTokens();
              this.isRefreshing = false;
            }
          } catch {
            this.clearTokens();
            this.isRefreshing = false;
          }
        } else {
          this.isRefreshing = false;
        }
      } else {
        // Queue this request until refresh completes
        return new Promise<T>((resolve, reject) => {
          this.addRefreshSubscriber(async (newToken: string) => {
            try {
              headers['Authorization'] = `Bearer ${newToken}`;
              const retryRes = await fetch(url, { ...options, headers });
              resolve(await this.handleResponse<T>(retryRes));
            } catch (retryErr) {
              reject(retryErr);
            }
          });
        });
      }
    }

    return this.handleResponse<T>(response);
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    if (response.status === 204) {
      return {} as T;
    }

    let bodyData: any;
    try {
      bodyData = isJson ? await response.json() : await response.text();
    } catch {
      bodyData = null;
    }

    if (!response.ok) {
      const errorObj = bodyData?.error;
      const message = errorObj?.message || bodyData?.detail || response.statusText || 'An error occurred';
      const code = errorObj?.code || `http_${response.status}`;
      const details = errorObj?.details || bodyData;
      throw new ApiError(message, response.status, code, details);
    }

    return bodyData as T;
  }

  // Convenience verbs
  public get<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T = any>(endpoint: string, body?: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  public put<T = any>(endpoint: string, body?: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  public patch<T = any>(endpoint: string, body?: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  public delete<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // ==========================================
  // Typed Domain API Methods
  // ==========================================

  // Auth
  public auth = {
    login: (credentials: { email: string; password?: string; totp_code?: string }) =>
      this.post('/accounts/login/', credentials, { headers: {} }),
    register: (data: { email: string; name: string; password?: string; workspace_name?: string }) =>
      this.post('/accounts/register/', data),
    me: () => this.get('/accounts/me/'),
    logout: (refreshToken?: string) => this.post('/accounts/logout/', { refresh: refreshToken }),
    changePassword: (data: any) => this.post('/accounts/change-password/', data),
    setup2FA: () => this.post('/accounts/2fa/setup/'),
    verify2FA: (code: string) => this.post('/accounts/2fa/verify/', { code }),
  };

  // Workspaces
  public workspaces = {
    list: () => this.get('/workspaces/'),
    get: (id: string) => this.get(`/workspaces/${id}/`),
    create: (data: { name: string; slug?: string; description?: string }) =>
      this.post('/workspaces/', data),
    update: (id: string, data: Partial<any>) => this.patch(`/workspaces/${id}/`, data),
    createInvite: (id: string, data?: { role?: string; expires_days?: number }) =>
      this.post(`/workspaces/${id}/invite/`, data),
    join: (token: string) => this.post('/workspaces/join/', { token }),
  };

  // Chat
  public chat = {
    getChannels: (workspaceId: string) => this.get(`/chat/channels/?workspace=${workspaceId}`),
    createChannel: (data: any) => this.post('/chat/channels/', data),
    updateChannel: (id: string, data: any) => this.patch(`/chat/channels/${id}/`, data),
    deleteChannel: (id: string) => this.delete(`/chat/channels/${id}/`),
    getMessages: (channelId: string, cursor?: string) =>
      this.get(`/chat/messages/?channel=${channelId}${cursor ? `&cursor=${cursor}` : ''}`),
    sendMessage: (data: { channel: string; content: string; attachments?: any[] }) =>
      this.post('/chat/messages/', data),
    editMessage: (id: string, content: string) =>
      this.patch(`/chat/messages/${id}/`, { content }),
    deleteMessage: (id: string) => this.delete(`/chat/messages/${id}/`),
    addReaction: (messageId: string, emoji: string) =>
      this.post(`/chat/messages/${messageId}/reactions/`, { emoji }),
    removeReaction: (messageId: string, emoji: string) =>
      this.delete(`/chat/messages/${messageId}/reactions/?emoji=${encodeURIComponent(emoji)}`),
    getThread: (messageId: string) => this.get(`/chat/messages/${messageId}/thread/`),
    sendThreadReply: (messageId: string, content: string) =>
      this.post(`/chat/messages/${messageId}/thread/`, { content }),
  };

  // Tasks
  public tasks = {
    list: (workspaceId: string, params?: Record<string, string>) => {
      const query = new URLSearchParams({ workspace: workspaceId, ...params }).toString();
      return this.get(`/tasks/?${query}`);
    },
    create: (data: any) => this.post('/tasks/', data),
    update: (id: string, data: any) => this.patch(`/tasks/${id}/`, data),
    delete: (id: string) => this.delete(`/tasks/${id}/`),
    reorder: (id: string, position: number) =>
      this.post(`/tasks/${id}/reorder/`, { position }),
    addComment: (id: string, content: string) =>
      this.post(`/tasks/${id}/comments/`, { content }),
  };

  // Calendar
  public calendar = {
    list: (workspaceId: string, start?: string, end?: string) => {
      const params = new URLSearchParams({ workspace: workspaceId });
      if (start) params.append('start', start);
      if (end) params.append('end', end);
      return this.get(`/calendar/?${params.toString()}`);
    },
    create: (data: any) => this.post('/calendar/', data),
    update: (id: string, data: any) => this.patch(`/calendar/${id}/`, data),
    delete: (id: string) => this.delete(`/calendar/${id}/`),
    checkConflicts: (data: { start_time: string; end_time: string; attendee_ids?: string[] }) =>
      this.post('/calendar/conflicts/', data),
    rsvp: (id: string, status: 'accepted' | 'declined' | 'tentative') =>
      this.post(`/calendar/${id}/rsvp/`, { status }),
  };

  // Meetings
  public meetings = {
    list: (workspaceId: string) => this.get(`/meetings/?workspace=${workspaceId}`),
    create: (data: any) => this.post('/meetings/', data),
    get: (id: string) => this.get(`/meetings/${id}/`),
    startInstant: (data?: { title?: string; workspace?: string }) =>
      this.post('/meetings/instant/', data),
    updateNotes: (id: string, notes: string) =>
      this.post(`/meetings/${id}/notes/`, { notes }),
  };

  // Reminders
  public reminders = {
    list: () => this.get('/reminders/'),
    create: (data: any) => this.post('/reminders/', data),
    toggleComplete: (id: string) => this.post(`/reminders/${id}/toggle/`),
    snooze: (id: string, minutes: number) => this.post(`/reminders/${id}/snooze/`, { minutes }),
    delete: (id: string) => this.delete(`/reminders/${id}/`),
  };

  // Notifications
  public notifications = {
    list: () => this.get('/notifications/'),
    markRead: (id: string) => this.post(`/notifications/${id}/read/`),
    markAllRead: () => this.post('/notifications/read-all/'),
    delete: (id: string) => this.delete(`/notifications/${id}/`),
  };

  // Files
  public files = {
    list: (workspaceId: string) => this.get(`/files/?workspace=${workspaceId}`),
    upload: (formData: FormData) => this.post('/files/', formData),
    delete: (id: string) => this.delete(`/files/${id}/`),
  };

  // AI Assistant
  public ai = {
    dailyBrief: (workspaceId: string) => this.post('/ai/daily-brief/', { workspace: workspaceId }),
    summarize: (data: { content?: string; channel_id?: string; thread_id?: string }) =>
      this.post('/ai/summarize/', data),
    extractActionItems: (content: string) => this.post('/ai/action-items/', { content }),
    rewrite: (content: string, tone: 'professional' | 'concise' | 'friendly' | 'elaborate') =>
      this.post('/ai/rewrite/', { content, tone }),
  };

  // Search
  public search = {
    query: (q: string, workspaceId: string, type?: string) => {
      const params = new URLSearchParams({ q, workspace: workspaceId });
      if (type) params.append('type', type);
      return this.get(`/search/?${params.toString()}`);
    },
  };

  // Polls
  public polls = {
    list: (channelId: string) => this.get(`/polls/?channel=${channelId}`),
    create: (data: any) => this.post('/polls/', data),
    vote: (pollId: string, optionId: string) =>
      this.post(`/polls/${pollId}/vote/`, { option_id: optionId }),
  };

  // Whiteboard
  public whiteboard = {
    get: (channelId: string) => this.get(`/whiteboard/${channelId}/`),
    saveSnapshot: (channelId: string, snapshot: any) =>
      this.post(`/whiteboard/${channelId}/snapshot/`, { snapshot }),
  };
}

export const apiClient = new ApiClient();
