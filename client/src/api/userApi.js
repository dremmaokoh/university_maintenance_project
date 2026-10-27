import { apiRequest } from './client.js';

export function listOfficers(token) {
  return apiRequest('/users/officers', { token });
}
