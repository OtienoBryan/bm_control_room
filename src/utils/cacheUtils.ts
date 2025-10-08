// Cache clearing utilities for development

export const clearAllCaches = () => {
  // Clear browser cache
  if ('caches' in window) {
    caches.keys().then((names) => {
      names.forEach((name) => {
        caches.delete(name);
      });
    });
  }

  // Clear localStorage
  localStorage.clear();
  
  // Clear sessionStorage
  sessionStorage.clear();
  
  // Force reload
  window.location.reload();
};

export const addCacheBuster = (url: string): string => {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_cb=${Date.now()}`;
};

// Development helper to force refresh
export const forceRefresh = () => {
  if (import.meta.env.DEV) {
    clearAllCaches();
  }
};


