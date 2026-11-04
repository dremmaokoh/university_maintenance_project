const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

function posix(filePath) {
  return filePath.replace(/\\/g, '/');
}

const errorJson = {
  'application/json': {
    schema: { $ref: '#/components/schemas/ErrorResponse' }
  }
};

const validationOrError = {
  'application/json': {
    schema: {
      oneOf: [
        { $ref: '#/components/schemas/ValidationErrorResponse' },
        { $ref: '#/components/schemas/ErrorResponse' }
      ]
    }
  }
};

function buildSwaggerSpec() {
  return swaggerJsdoc({
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Resolva — University Maintenance & Service Request API',
        version: '1.0.0',
        description:
          'REST API for organisation setup, team invites, maintenance requests, assignments, status history, comments, and ratings. ' +
          'Staff and students share the role `student`; `memberType` distinguishes them. ' +
          'Administrators see their organisation. Officers see requests assigned to them. Requesters see their own requests. ' +
          'Protected operations expect `Authorization: Bearer <token>` from login, registration, organisation setup, or an accepted invite.'
      },
      servers: [
        { url: '/api', description: 'Same host as this documentation page' },
        { url: 'http://localhost:5000/api', description: 'Local development' },
        {
          url: 'https://university-maintenance-project.onrender.com/api',
          description: 'Production'
        }
      ],
      tags: [
        { name: 'Health', description: 'Process and database connectivity.' },
        { name: 'Authentication', description: 'Organisation setup, registration, login, and password reset.' },
        { name: 'Organisations', description: 'Public organisation lookup by signup link.' },
        { name: 'Users', description: 'Administrator management of team accounts and requesters.' },
        { name: 'Invites', description: 'Invitations for administrators and maintenance officers.' },
        { name: 'Categories', description: 'Maintenance request categories for one organisation.' },
        {
          name: 'Requests',
          description:
            'Create, list, assign, and update maintenance requests, including evidence, history, comments, and ratings.'
        },
        { name: 'Assignments', description: 'Assignment history for an organisation.' },
        { name: 'Dashboard', description: 'Role-scoped request counts and recent requests.' },
        { name: 'Reports', description: 'Organisation-wide request summaries. Export routes return JSON, not a CSV file.' }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Paste the `token` returned by login, registration, organisation setup, or invite acceptance. Do not include the word Bearer.'
          }
        },
        parameters: {
          Page: {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
            description: 'Page number, starting at 1.'
          },
          Limit: {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
            description: 'Page size. Maximum 50.'
          },
          Search: {
            name: 'search',
            in: 'query',
            schema: { type: 'string' },
            description: 'Case-insensitive text match.'
          },
          Order: {
            name: 'order',
            in: 'query',
            schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
            description: 'Sort direction. Descending is the default.'
          }
        },
        responses: {
          BadRequest: {
            description: 'The body failed validation, or a business rule rejected the change.',
            content: validationOrError
          },
          Unauthorized: {
            description: 'Missing, invalid, or expired token, or the account is not active.',
            content: errorJson
          },
          Forbidden: {
            description: 'The account is signed in but is not allowed to perform this action.',
            content: errorJson
          },
          NotFound: {
            description: 'The resource does not exist, or it is outside the caller’s organisation.',
            content: errorJson
          },
          Conflict: {
            description: 'The change conflicts with an existing record.',
            content: errorJson
          },
          Gone: {
            description: 'The link has expired.',
            content: errorJson
          },
          InternalError: {
            description: 'Unexpected server error. The response does not include a stack trace.',
            content: errorJson
          }
        },
        schemas: {
          ErrorResponse: {
            type: 'object',
            required: ['success', 'message'],
            properties: {
              success: { type: 'boolean', example: false },
              message: { type: 'string', example: 'Please log in to continue.' }
            }
          },
          ValidationError: {
            type: 'object',
            required: ['field', 'message'],
            properties: {
              field: { type: 'string', example: 'email' },
              message: { type: 'string', example: 'A valid email is required.' }
            }
          },
          ValidationErrorResponse: {
            type: 'object',
            required: ['success', 'message', 'errors'],
            properties: {
              success: { type: 'boolean', example: false },
              message: { type: 'string', example: 'Please check the highlighted fields.' },
              errors: {
                type: 'array',
                items: { $ref: '#/components/schemas/ValidationError' }
              }
            }
          },
          MessageResponse: {
            type: 'object',
            required: ['success', 'message'],
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Category deleted.' }
            }
          },
          OrganisationRef: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '665f1c2e8a0b1c0011223344' },
              name: { type: 'string', example: 'North Campus' },
              slug: { type: 'string', example: 'north-campus' }
            }
          },
          Organisation: {
            type: 'object',
            required: ['id', 'name', 'slug'],
            properties: {
              id: { type: 'string' },
              name: { type: 'string', example: 'North Campus' },
              slug: { type: 'string', example: 'north-campus' }
            }
          },
          AuthUser: {
            type: 'object',
            description: 'Signed-in user returned with a token. Password hashes are never included.',
            properties: {
              id: { type: 'string' },
              fullName: { type: 'string', example: 'Ada Lovelace' },
              email: { type: 'string', format: 'email', example: 'ada@university.edu' },
              role: { type: 'string', enum: ['student', 'officer', 'admin'] },
              memberType: { type: 'string', enum: ['student', 'staff'] },
              accountStatus: { type: 'string', enum: ['pending', 'active'] },
              organisationId: { type: 'string' },
              organisation: { $ref: '#/components/schemas/OrganisationRef' }
            }
          },
          AuthSession: {
            type: 'object',
            required: ['success', 'data'],
            properties: {
              success: { type: 'boolean', example: true },
              data: {
                type: 'object',
                required: ['user', 'token'],
                properties: {
                  user: { $ref: '#/components/schemas/AuthUser' },
                  token: { type: 'string', description: 'JWT access token. Send it as a Bearer token.' }
                }
              }
            }
          },
          AccountChoice: {
            type: 'object',
            properties: {
              userId: { type: 'string' },
              role: { type: 'string', enum: ['student', 'officer', 'admin'] },
              organisationId: { type: 'string' },
              organisationName: { type: 'string' },
              organisationSlug: { type: 'string', nullable: true }
            }
          },
          AccountChoiceResponse: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              data: {
                type: 'object',
                properties: {
                  requiresAccountChoice: { type: 'boolean', example: true },
                  accounts: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/AccountChoice' }
                  }
                }
              }
            }
          },
          PublicUser: {
            type: 'object',
            description: 'Team or requester account visible to an administrator.',
            properties: {
              id: { type: 'string' },
              fullName: { type: 'string' },
              email: { type: 'string', format: 'email' },
              role: { type: 'string', enum: ['student', 'officer', 'admin'] },
              memberType: { type: 'string', enum: ['student', 'staff'] },
              accountStatus: { type: 'string', enum: ['pending', 'active'] },
              isActive: { type: 'boolean' },
              jobTitle: { type: 'string', nullable: true },
              organisationId: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              averageRating: { type: 'number', nullable: true, description: 'Present for officers who have been rated.' },
              ratingCount: { type: 'integer' },
              accountStatusLabel: { type: 'string', enum: ['Active', 'Inactive'] },
              roleLabel: { type: 'string' }
            }
          },
          Category: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string', example: 'Electrical' },
              description: { type: 'string', example: 'Lights, sockets, and power faults.' }
            }
          },
          SuggestedCategory: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' }
            }
          },
          Evidence: {
            type: 'object',
            description: 'Metadata for an uploaded evidence file. Storage keys and Cloudinary credentials are not returned.',
            properties: {
              originalName: { type: 'string', example: 'leaking-pipe.jpg' },
              mimeType: { type: 'string', example: 'image/jpeg' },
              size: { type: 'integer', example: 240112 },
              uploadedAt: { type: 'string', format: 'date-time' },
              storageProvider: { type: 'string', enum: ['cloudinary', 'local'] }
            }
          },
          PersonRef: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              fullName: { type: 'string' },
              email: { type: 'string', format: 'email' },
              memberType: { type: 'string', enum: ['student', 'staff'] },
              jobTitle: { type: 'string', nullable: true }
            }
          },
          MaintenanceRequest: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string', example: 'Leaking pipe in Block B' },
              description: { type: 'string' },
              location: { type: 'string', example: 'Block B, room 12' },
              status: { type: 'string', enum: ['pending', 'assigned', 'in_progress', 'completed'] },
              category: {
                type: 'object',
                nullable: true,
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' }
                }
              },
              requester: { allOf: [{ $ref: '#/components/schemas/PersonRef' }], nullable: true },
              assignedOfficer: { allOf: [{ $ref: '#/components/schemas/PersonRef' }], nullable: true },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              completedAt: { type: 'string', format: 'date-time', nullable: true },
              officerRating: { type: 'integer', minimum: 1, maximum: 5, nullable: true },
              ratedAt: { type: 'string', format: 'date-time', nullable: true },
              resolutionDuration: { type: 'string', nullable: true },
              evidence: { allOf: [{ $ref: '#/components/schemas/Evidence' }], nullable: true },
              assignedAt: { type: 'string', format: 'date-time', nullable: true }
            }
          },
          RequestPage: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              data: {
                type: 'object',
                properties: {
                  items: { type: 'array', items: { $ref: '#/components/schemas/MaintenanceRequest' } },
                  page: { type: 'integer' },
                  limit: { type: 'integer' },
                  total: { type: 'integer' },
                  totalPages: { type: 'integer' }
                }
              }
            }
          },
          CreateRequest: {
            type: 'object',
            required: ['title', 'description', 'location', 'categoryId'],
            properties: {
              title: { type: 'string', example: 'Leaking pipe in Block B' },
              description: { type: 'string', example: 'Water is pooling under the sink.' },
              location: { type: 'string', example: 'Block B, room 12' },
              categoryId: { type: 'string', description: 'Category id from GET /categories.' },
              evidence: {
                type: 'string',
                format: 'binary',
                description: 'Optional. JPEG, PNG, GIF, WebP, or PDF. Maximum 5 MB. Send only with multipart/form-data.'
              }
            }
          },
          Assignment: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              request: {
                type: 'object',
                nullable: true,
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  status: { type: 'string' }
                }
              },
              officer: { allOf: [{ $ref: '#/components/schemas/PersonRef' }], nullable: true },
              assignedBy: {
                type: 'object',
                nullable: true,
                properties: {
                  id: { type: 'string' },
                  fullName: { type: 'string' }
                }
              },
              createdAt: { type: 'string', format: 'date-time' }
            }
          },
          StatusHistoryEntry: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              status: { type: 'string', enum: ['pending', 'assigned', 'in_progress', 'completed'] },
              note: { type: 'string' },
              actor: {
                type: 'object',
                nullable: true,
                properties: {
                  id: { type: 'string' },
                  fullName: { type: 'string' },
                  role: { type: 'string', enum: ['student', 'officer', 'admin'] }
                }
              },
              createdAt: { type: 'string', format: 'date-time' }
            }
          },
          Comment: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              body: { type: 'string' },
              visibleToRequester: {
                type: 'boolean',
                description: 'True when an administrator or officer mentions the requester with @Full Name, or the legacy @student marker.'
              },
              author: {
                type: 'object',
                nullable: true,
                properties: {
                  id: { type: 'string', nullable: true },
                  fullName: { type: 'string' },
                  role: { type: 'string', nullable: true, enum: ['student', 'officer', 'admin'] },
                  memberType: { type: 'string', enum: ['student', 'staff'] }
                }
              },
              createdAt: { type: 'string', format: 'date-time' }
            }
          },
          DatabaseHealth: {
            type: 'object',
            properties: {
              connected: { type: 'boolean' },
              storage: { type: 'string', example: 'atlas' },
              name: { type: 'string', nullable: true },
              host: { type: 'string', nullable: true }
            }
          }
        }
      }
    },
    apis: [
      posix(path.join(__dirname, '../app.js')),
      posix(path.join(__dirname, '../routes/*.js'))
    ]
  });
}

module.exports = { buildSwaggerSpec };
