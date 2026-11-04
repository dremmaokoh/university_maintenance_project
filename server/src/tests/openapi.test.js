const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildSwaggerSpec } = require('../config/swagger');

const EXPECTED_OPERATIONS = [
  'getHealth',
  'getOpenApiSpec',
  'canCreateOrganisation',
  'setupAdmin',
  'register',
  'login',
  'forgotPassword',
  'previewPasswordReset',
  'resetPassword',
  'getCurrentUser',
  'getOrganisationBySlug',
  'listTeamUsers',
  'listOfficers',
  'getTeamStats',
  'exportTeamUsers',
  'getMemberStats',
  'listOrgMembers',
  'exportOrgMembers',
  'getTeamMemberProfile',
  'getUser',
  'updateUser',
  'createInvite',
  'previewInvite',
  'acceptInvite',
  'listCategories',
  'createCategory',
  'listSuggestedCategories',
  'updateCategory',
  'deleteCategory',
  'listRequests',
  'createRequest',
  'getOfficerWorkStats',
  'exportRequests',
  'getRequestEvidence',
  'getRequest',
  'deleteRequest',
  'assignRequest',
  'unassignRequest',
  'updateRequestStatus',
  'getRequestHistory',
  'listRequestComments',
  'addRequestComment',
  'rateRequest',
  'listAssignments',
  'getDashboardOverview',
  'getReportSummary'
];

function collectRefs(node, refs) {
  if (!node || typeof node !== 'object') {
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((item) => collectRefs(item, refs));
    return;
  }
  Object.entries(node).forEach(([key, value]) => {
    if (key === '$ref' && typeof value === 'string') {
      refs.push(value);
      return;
    }
    collectRefs(value, refs);
  });
}

function resolveRef(spec, ref) {
  assert.equal(ref.startsWith('#/'), true, ref);
  return ref
    .slice(2)
    .split('/')
    .reduce((cursor, part) => cursor && cursor[part], spec);
}

test('OpenAPI spec documents the implemented API', () => {
  const spec = buildSwaggerSpec();

  assert.equal(spec.openapi, '3.0.0');
  assert.equal(spec.components.securitySchemes.bearerAuth.type, 'http');
  assert.equal(spec.components.securitySchemes.bearerAuth.scheme, 'bearer');
  assert.ok(spec.servers.some((server) => server.url === '/api'));
  assert.equal(spec.security, undefined);

  const operationIds = [];
  Object.entries(spec.paths).forEach(([routePath, pathItem]) => {
    Object.entries(pathItem).forEach(([method, operation]) => {
      if (method === 'parameters') {
        return;
      }
      assert.equal(typeof operation.summary, 'string', `${method} ${routePath}`);
      assert.ok(operation.tags && operation.tags.length > 0, `${method} ${routePath}`);
      operationIds.push(operation.operationId);
    });
  });

  assert.deepEqual(operationIds.slice().sort(), EXPECTED_OPERATIONS.slice().sort());

  const refs = [];
  collectRefs(spec, refs);
  refs.forEach((ref) => {
    assert.ok(resolveRef(spec, ref), `Unresolved reference ${ref}`);
  });
});
