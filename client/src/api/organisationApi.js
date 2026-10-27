import { apiRequest } from './client.js';

export function getOrganisationBySlug(slug) {
  return apiRequest(`/organisations/${slug}`);
}
