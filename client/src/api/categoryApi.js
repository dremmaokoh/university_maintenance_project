import { apiRequest } from './client.js';

export function listCategories(token) {
  return apiRequest('/categories', { token });
}
