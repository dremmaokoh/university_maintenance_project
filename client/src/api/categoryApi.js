import { apiRequest } from './client.js';

export function listCategories(token) {
  return apiRequest('/categories', { token });
}

export function createCategory(token, body) {
  return apiRequest('/categories', { method: 'POST', token, body });
}

export function listSuggestedCategories(token) {
  return apiRequest('/categories/suggested', { token });
}
