const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

function buildSwaggerSpec() {
  return swaggerJsdoc({
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'University Maintenance & Service Request API',
        version: '1.0.0',
        description: 'MIT 8333 — maintenance request system'
      },
      servers: [{ url: '/api', description: 'API' }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    },
    apis: [path.join(__dirname, '../routes/*.js')]
  });
}

module.exports = { buildSwaggerSpec };
