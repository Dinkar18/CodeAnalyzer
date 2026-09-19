// User-Scoped BYOK Storage Utility
// Ensures each user has 100% private, isolated API keys that never bleed to other users or sessions.

export const getBYOKStorageKey = (prefix, provider, userId) => {
  const uid = userId || 'anonymous';
  return `byok_${uid}_${prefix}_${provider}`;
};

export const getActiveProvider = (userId) => {
  const uid = userId || 'anonymous';
  return localStorage.getItem(`byok_${uid}_active_provider`) || 'gemini';
};

export const setActiveProvider = (provider, userId) => {
  const uid = userId || 'anonymous';
  localStorage.setItem(`byok_${uid}_active_provider`, provider);
};

export const getBYOKKey = (provider, userId) => {
  const uid = userId || 'anonymous';
  return localStorage.getItem(`byok_${uid}_key_${provider}`) || '';
};

export const setBYOKKey = (provider, key, userId) => {
  const uid = userId || 'anonymous';
  if (key && key.trim()) {
    localStorage.setItem(`byok_${uid}_key_${provider}`, key.trim());
  } else {
    localStorage.removeItem(`byok_${uid}_key_${provider}`);
  }
};

export const getBYOKModel = (provider, defaultModel, userId) => {
  const uid = userId || 'anonymous';
  return localStorage.getItem(`byok_${uid}_model_${provider}`) || defaultModel || '';
};

export const setBYOKModel = (provider, model, userId) => {
  const uid = userId || 'anonymous';
  if (model) {
    localStorage.setItem(`byok_${uid}_model_${provider}`, model);
  }
};

export const getBYOKUrl = (provider, userId) => {
  const uid = userId || 'anonymous';
  return localStorage.getItem(`byok_${uid}_url_${provider}`) || '';
};

export const setBYOKUrl = (provider, url, userId) => {
  const uid = userId || 'anonymous';
  if (url) {
    localStorage.setItem(`byok_${uid}_url_${provider}`, url);
  }
};
