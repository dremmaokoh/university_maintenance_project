import { apiRequest } from './client.js';

export function getSetupAvailable() {
  return apiRequest('/auth/setup-available');
}

export function setupAdmin(payload) {
  return apiRequest('/auth/setup-admin', { method: 'POST', body: payload });
}

export function registerStudent(payload) {
  return apiRequest('/auth/register', { method: 'POST', body: payload });
}

export function login(payload) {
  return apiRequest('/auth/login', { method: 'POST', body: payload });
}

export function getMe(token) {
  return apiRequest('/auth/me', { token });
}
