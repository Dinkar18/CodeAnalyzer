/**
 * Centralized API Endpoints for the Frontend Application.
 * Prevents typos, avoids magic strings, and ensures single source of truth for REST routes.
 */

export const API_BASE_URL = '/api';

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    TOKEN: `${API_BASE_URL}/auth/token`,
    SIGNUP: `${API_BASE_URL}/auth/signup`,
    SIGNIN: `${API_BASE_URL}/auth/signin`,
    OAUTH_CONFIG: `${API_BASE_URL}/auth/oauth/config`,
    VERIFY_EMAIL: (token) => `${API_BASE_URL}/auth/verify-email?token=${encodeURIComponent(token)}`,
    RESEND_VERIFICATION: `${API_BASE_URL}/auth/resend-verification`,
    OAUTH_GOOGLE: `${API_BASE_URL}/auth/oauth/google`,
    OAUTH_GITHUB: `${API_BASE_URL}/auth/oauth/github`,
    OAUTH_GITHUB_CALLBACK: `${API_BASE_URL}/auth/oauth/github/callback`,
    OAUTH_GOOGLE_CALLBACK: `${API_BASE_URL}/auth/oauth/google/callback`,
    ME: `${API_BASE_URL}/auth/me`,
  },

  // Repositories
  REPOSITORIES: {
    BASE: `${API_BASE_URL}/repositories`,
    BY_ID: (id) => `${API_BASE_URL}/repositories/${id}`,
    TRIGGER_INDEX: (id) => `${API_BASE_URL}/repositories/${id}/index`,
    STATUS: (id) => `${API_BASE_URL}/repositories/${id}/status`,
    BRANCHES: (id) => `${API_BASE_URL}/repositories/${id}/branches`,
    DIFF: (id, base, target) => `${API_BASE_URL}/repositories/${id}/diff?base=${encodeURIComponent(base || 'main')}&target=${encodeURIComponent(target || 'HEAD')}`,
  },

  // Files & Codebase Graph
  FILES: {
    LIST_BY_REPO: (repoId) => `${API_BASE_URL}/files/${repoId}`,
    CONTENT: (repoId) => `${API_BASE_URL}/files/${repoId}/content`,
    GRAPH: (repoId) => `${API_BASE_URL}/files/${repoId}/graph`,
  },

  // Agent Chat & Historical Conversations
  CHAT: {
    SEND: `${API_BASE_URL}/chat`,
    STREAM: `${API_BASE_URL}/chat/stream`,
    CONVERSATIONS_BY_REPO: (repoId) => `${API_BASE_URL}/chat/conversations/${repoId}`,
    CONVERSATION_BY_ID: (conversationId) => `${API_BASE_URL}/chat/conversations/id/${conversationId}`,
    MESSAGES_BY_CONVERSATION: (conversationId) => `${API_BASE_URL}/chat/conversations/${conversationId}/messages`,
  },

  // Specialist Analysis & Audits
  ANALYSIS: {
    RUN: `${API_BASE_URL}/analysis/run`,
    FINDINGS_BY_REPO: (repoId) => `${API_BASE_URL}/analysis/${repoId}`,
  },
};

export const PROVIDERS = {
  GEMINI: 'gemini',
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  GROQ: 'groq',
  DEEPSEEK: 'deepseek',
  OLLAMA: 'ollama',
};

export const VIEW_MODES = {
  CHAT: 'chat',
  CODE: 'code',
  GRAPH: 'graph',
  FINDINGS: 'findings',
};
