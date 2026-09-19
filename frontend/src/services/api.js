import axios from 'axios';
import { API_ENDPOINTS } from '../constants/apiEndpoints';

const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT Bearer Token and Ephemeral BYOK Headers dynamically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('architect_jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Ephemeral BYOK Headers
  const activeProv = localStorage.getItem('byok_provider') || 'gemini';
  const customApiKey = localStorage.getItem(`byok_key_${activeProv}`);
  const customModel = localStorage.getItem(`byok_model_${activeProv}`);
  const customBaseUrl = localStorage.getItem(`byok_url_${activeProv}`);

  if (activeProv) config.headers['X-LLM-Provider'] = activeProv;
  if (customApiKey) config.headers['X-LLM-API-Key'] = customApiKey;
  if (customModel) config.headers['X-LLM-Model'] = customModel;
  if (customBaseUrl) config.headers['X-LLM-Base-URL'] = customBaseUrl;

  return config;
});

// Response interceptor: on 401 Unauthorized, gracefully clear stale session
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('architect_jwt_token');
      localStorage.removeItem('architect_user');
      // If not already on an auth page, redirect to signin
      const path = window.location.pathname;
      if (path !== '/signin' && path !== '/signup' && path !== '/verify-email' && path !== '/') {
        window.location.href = '/signin';
      }
    }
    return Promise.reject(error);
  }
);

export const AuthAPI = {
  getToken: (data) => api.post(API_ENDPOINTS.AUTH.TOKEN, data),
  signUp: (data) => api.post(API_ENDPOINTS.AUTH.SIGNUP, data),
  signIn: (data) => api.post(API_ENDPOINTS.AUTH.SIGNIN, data),
  verifyEmail: (token) => api.get(API_ENDPOINTS.AUTH.VERIFY_EMAIL(token)),
  resendVerification: (email) => api.post(API_ENDPOINTS.AUTH.RESEND_VERIFICATION, { email }),
  oauthGoogle: (data) => api.post(API_ENDPOINTS.AUTH.OAUTH_GOOGLE, data),
  oauthGithub: (data) => api.post(API_ENDPOINTS.AUTH.OAUTH_GITHUB, data),
  oauthGithubCallback: (data) => api.post(API_ENDPOINTS.AUTH.OAUTH_GITHUB_CALLBACK, data),
  oauthGoogleCallback: (data) => api.post(API_ENDPOINTS.AUTH.OAUTH_GOOGLE_CALLBACK, data),
  getOAuthConfig: () => api.get(API_ENDPOINTS.AUTH.OAUTH_CONFIG),
  getMe: () => api.get(API_ENDPOINTS.AUTH.ME),
};

export const RepositoryAPI = {
  list: () => api.get(API_ENDPOINTS.REPOSITORIES.BASE),
  getById: (id) => api.get(API_ENDPOINTS.REPOSITORIES.BY_ID(id)),
  create: (data) => api.post(API_ENDPOINTS.REPOSITORIES.BASE, data),
  delete: (id) => api.delete(API_ENDPOINTS.REPOSITORIES.BY_ID(id)),
  indexStatus: (id) => api.get(API_ENDPOINTS.REPOSITORIES.STATUS(id)),
  triggerIndex: (id, force = false) => api.post(`${API_ENDPOINTS.REPOSITORIES.TRIGGER_INDEX(id)}?force=${force}`),
  getBranches: (id) => api.get(API_ENDPOINTS.REPOSITORIES.BRANCHES(id)),
  getDiff: (id, base, target) => api.get(API_ENDPOINTS.REPOSITORIES.DIFF(id, base, target)),
};

export const FileAPI = {
  listFiles: (repoId) => api.get(API_ENDPOINTS.FILES.LIST_BY_REPO(repoId)),
  getFileContent: (repoId, path) => api.get(`${API_ENDPOINTS.FILES.CONTENT(repoId)}?path=${encodeURIComponent(path)}`),
  getGraph: (repoId) => api.get(API_ENDPOINTS.FILES.GRAPH(repoId)),
};

export const ChatAPI = {
  sendMessage: (data) => api.post(API_ENDPOINTS.CHAT.SEND, data),
  getConversations: (repoId) => api.get(API_ENDPOINTS.CHAT.CONVERSATIONS_BY_REPO(repoId)),
  getMessages: (conversationId) => api.get(API_ENDPOINTS.CHAT.MESSAGES_BY_CONVERSATION(conversationId)),
  deleteConversation: (conversationId) => api.delete(API_ENDPOINTS.CHAT.CONVERSATION_BY_ID(conversationId)),
  
  // Real-Time Server-Sent Events (SSE) Stream Reader with JWT and Ephemeral BYOK Headers
  streamMessage: async (payload, onToken, onDone, onError) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      };
      const token = localStorage.getItem('architect_jwt_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      if (payload.provider) headers['X-LLM-Provider'] = payload.provider;
      if (payload.custom_api_key) headers['X-LLM-API-Key'] = payload.custom_api_key;
      if (payload.custom_model) headers['X-LLM-Model'] = payload.custom_model;
      if (payload.custom_base_url) headers['X-LLM-Base-URL'] = payload.custom_base_url;

      const response = await fetch(API_ENDPOINTS.CHAT.STREAM, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('architect_jwt_token');
          localStorage.removeItem('architect_user');
          window.location.href = '/signin';
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data:')) {
            const jsonStr = trimmed.replace(/^data:\s*/, '');
            if (!jsonStr) continue;
            try {
              const data = JSON.parse(jsonStr);
              if (data.type === 'token') {
                onToken(data.content);
              } else if (data.type === 'done') {
                onDone(data);
              }
            } catch (e) {
              // Ignore non-json lines
            }
          }
        }
      }
    } catch (err) {
      if (onError) onError(err);
    }
  },
};

export const AnalysisAPI = {
  run: (data) => api.post(API_ENDPOINTS.ANALYSIS.RUN, data),
  getFindings: (repoId) => api.get(API_ENDPOINTS.ANALYSIS.FINDINGS_BY_REPO(repoId)),
};

export default api;
