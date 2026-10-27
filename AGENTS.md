# AGENTS.md — Project Coding Standards

## 1. Project Context

This project is a University Maintenance and Service Request System developed for MIT 8333 — Advanced Web Application Development.

### Technology stack

- Frontend: React with Vite
- Frontend language: JavaScript initially; use TypeScript only if explicitly approved for the project
- Backend: Node.js with Express.js
- Backend language: JavaScript (use TypeScript only if explicitly approved for the project)
- Database: MongoDB
- ODM: Mongoose
- Data validation: express-validator or an agreed validation library
- Authentication: JWT
- API documentation: Swagger/OpenAPI
- Version control: Git

### Core user roles

- Student/Staff
- Maintenance Officer
- Administrator

### Primary objective

Build a secure, maintainable, tested, and deployable full-stack application that satisfies the assignment requirements.

Do not introduce AI features, microservices, unnecessary infrastructure, or unrelated functionality.

## 2. General Coding Principles

Write simple, readable, maintainable code.

Follow established conventions for each language and framework.

Prefer straightforward solutions over clever or unnecessarily abstract implementations.

Follow DRY principles without creating premature abstractions.

Keep functions, components, and modules focused on one responsibility.

Avoid duplicated business logic.

Use descriptive variable, function, component, and file names.

Never introduce a dependency when existing project functionality can solve the problem adequately.

Do not rewrite working code unless the task requires it.

Do not implement features that are outside the approved requirements.

Never leave core functionality as TODOs, placeholders, or mock implementations.

Do not claim code works unless it has been appropriately tested.

## 3. Rules for AI Coding Agents

Before implementing any task:

- Inspect the existing project structure and relevant files.
- Read this file and any applicable Cursor rules.
- Understand the existing architecture and conventions.
- Identify the files that need to change.
- Explain the intended implementation briefly.
- Implement only the requested feature and necessary supporting changes.

When implementing:

- Reuse existing components, services, utilities, and patterns.
- Do not create duplicate files or competing implementations.
- Do not replace working implementations without justification.
- Do not modify unrelated features.
- Do not install packages without explaining why they are needed.
- Do not change environment variables, deployment settings, or Mongoose schemas without explaining the impact.
- Ask before making destructive changes or major architectural decisions.

After implementation:

- Summarise the changes made.
- List files created, modified, or deleted.
- Run relevant tests and checks where available.
- Report actual test results, including failures.
- Identify anything that remains incomplete.
- Explain important code in beginner-friendly language.

Never fabricate test results or claim that a deployment succeeded without verification.

## 4. JavaScript and Node.js Standards

### Style

Follow established JavaScript and Node.js conventions.

Use consistent indentation (two spaces by default for JavaScript).

Use camelCase for variables and functions.

Use PascalCase for classes and React components.

Use UPPER_SNAKE_CASE for constants where appropriate.

Prefer const; use let only when reassignment is needed. Avoid var.

Use clear names and concise comments where they add value.

Use async/await consistently for asynchronous operations.

### Code quality

Keep functions small and focused.

Avoid deeply nested conditionals.

Avoid unexplained magic numbers and strings.

Handle errors explicitly; do not silently swallow exceptions.

Use appropriate server-side logging for diagnostic information.

Do not expose stack traces or sensitive internal details to users.

Avoid blocking the Node.js event loop with expensive synchronous operations.

### Error handling

Use Express error-handling middleware consistently.

Return appropriate HTTP status codes from API endpoints.

Validate inputs before performing important operations.

Handle rejected promises and asynchronous errors.

Return safe, understandable error messages without exposing internal details.

### Dependencies

Use npm and maintain package.json and the lockfile.

Track required dependencies in the project's dependency files.

Do not install packages globally for this project.

Avoid unnecessary packages.

Keep secrets and environment-specific configuration in environment variables.

## 5. Express.js Standards

### Architecture

Keep responsibilities separated:

- Routes: HTTP endpoints and request/response handling.
- Validators: request validation and input schemas.
- Models: database models and relationships.
- Services: business logic.
- Database: connection and configuration.
- Middleware: authentication, authorisation, and centralised error handling.
- Authentication: password hashing, token creation, and verification.
- Tests: automated backend tests.

Use this structure consistently, but do not create empty modules or unnecessary layers.

### API design

Use REST conventions consistently.

Use plural resource names where appropriate.

Return appropriate HTTP status codes.

Validate request bodies using the agreed validation library.

Return deliberate, consistent response shapes and avoid exposing internal database fields.

Use pagination for collection endpoints where appropriate.

Avoid returning database objects directly without deliberate response handling.

Keep endpoint handlers focused on HTTP concerns.

Keep complex business logic out of route handlers.

### Security

Hash passwords using an established password-hashing library such as bcrypt or Argon2.

Never store plaintext passwords.

Never hardcode JWT secrets, database passwords, or API keys.

Load secrets from environment variables.

Validate JWTs on protected endpoints.

Enforce permissions on the backend.

Never rely on frontend route protection alone.

Return only the information each user is authorised to access.

### Transactions and database operations

Use appropriate transaction boundaries.

Handle database errors deliberately.

Avoid unnecessary queries and repeated database lookups.

Never delete or modify production data without explicit authorisation.

## 6. React Standards

### Components

Use functional components and React hooks.

Use PascalCase for component names and component files.

Use camelCase for variables and functions.

Keep components focused on a clear responsibility.

Extract genuinely reusable UI into shared components.

Avoid building one enormous component for an entire page.

Avoid creating abstractions for one-off, trivial elements.

### State and rendering

Use React state for interactive UI.

Use useEffect only for synchronisation with external systems.

Avoid unnecessary effects and duplicated state.

Use stable keys when rendering lists.

Handle loading, error, empty, and success states where appropriate.

Avoid direct DOM manipulation unless there is a clear need.

### Forms

Validate required fields.

Display understandable validation messages.

Prevent accidental duplicate submissions.

Disable submit buttons when appropriate during submission.

Display API errors clearly.

Never assume frontend validation replaces backend validation.

### API communication

Keep API calls in a consistent service layer.

Use one configured API base URL.

Do not hardcode deployment-specific URLs throughout components.

Handle loading, network failure, and API error responses.

Do not put secrets in frontend environment variables.

Never store passwords in browser storage.

### UI quality

Reuse consistent colours, typography, spacing, and controls.

Make layouts responsive.

Use semantic HTML and accessible form labels.

Provide visible keyboard focus.

Use appropriate contrast.

Preserve the approved design when implementing screenshots or Figma references.

Do not introduce a new design system or UI library without approval.

## 7. MongoDB and Database Standards

Use clear, consistent collection and field names.

Use Mongoose schemas to define document structure, validation, defaults, and indexes.

Use MongoDB ObjectId references where relationships between documents are required.

Add indexes where justified by query patterns.

Enforce important data integrity rules through schema validation and application logic.

Use deliberate, reviewed scripts for production data or schema-related changes.

Never commit real credentials or sensitive user data.

Use Mongoose query methods safely; do not construct unsafe queries from untrusted input.

Avoid storing redundant data without a clear reason.

Choose embedding versus referencing deliberately based on access patterns and data ownership.

### Required collections / entities

- Users
- Roles (may be represented as validated role values on users if that is simpler and secure)
- Service Requests
- Request Categories
- Assignments
- Status Updates/Logs

Maintain clear relationships between requesters, assigned maintenance officers, categories, requests, and status history. Use Mongoose references or embedded documents intentionally, and preserve request status history where required.

## 8. Authentication and Authorisation

Support the three approved user roles.

Enforce permissions on every protected backend operation.

Students/staff may access only their own requests unless explicitly authorised otherwise.

Maintenance officers may access and update only requests assigned to them.

Administrators may manage system-wide requests and assignments.

Validate role changes and privileged operations on the backend.

Never trust a role supplied by the client without verifying it against the authenticated user.

Prevent unauthorised users from assigning requests or managing accounts.

Avoid leaking whether sensitive account information exists.

## 9. Testing Standards

Write tests for important behaviour and business rules.

### Backend tests

- Authentication and invalid credentials.
- Role-based permissions.
- Request creation and retrieval.
- Request assignment.
- Status transitions.
- Input validation.
- Not-found and unauthorised responses.

### Frontend tests

- Important form validation.
- Loading and error states.
- Request submission.
- Request listing and tracking.
- Role-specific interface behaviour.

### Testing rules

Never remove a failing test simply to make the suite pass.

Investigate failures before changing implementation.

Use test data rather than real user data.

Run relevant checks after meaningful changes.

Report untested behaviour honestly.

## 10. Environment and Configuration

Maintain an `.env.example` containing placeholder values only.

Keep real `.env` files out of version control.

Configure database connections and secrets through environment variables.

Provide clear setup instructions.

Keep development and production configuration separate.

Do not expose secrets in logs, screenshots, API responses, or documentation.

## 11. Git Standards

Use descriptive commit messages.

Make small, logically related commits.

Do not commit secrets, virtual environments, `node_modules`, build artefacts, or local databases.

Inspect changes before committing.

Avoid destructive Git commands unless explicitly authorised.

Do not overwrite existing user work without permission.

## 12. Performance and Scope Control

Build only what the assignment requires or what is necessary for reliability.

Prefer the simplest maintainable implementation.

Avoid premature optimisation.

Avoid microservices, WebSockets, background workers, and additional infrastructure unless explicitly approved.

Do not add AI features.

Prioritise completing core workflows before optional enhancements.

Keep the application deployable throughout development.

## 13. Documentation

Document setup, configuration, and execution.

Explain important API endpoints.

Keep documentation consistent with actual implementation.

Include meaningful comments only where the code is not self-explanatory.

Do not generate fictional screenshots, test results, or deployment evidence.

## 14. Definition of Done

A task is complete only when:

- It satisfies the requested requirement.
- It follows the project architecture and coding standards.
- Inputs are validated.
- Relevant permissions are enforced.
- Errors are handled appropriately.
- Relevant tests have been run.
- No unrelated functionality has been broken knowingly.
- Any incomplete work is explicitly reported.
- Important implementation decisions are explained to the developer.

The application must remain understandable to a developer learning JavaScript, Node.js, Express.js, and React. Prefer code that is easy to explain, debug, test, and maintain.
