# Project Rules

## 1. Consistent Session and Authentication Fields
When reading or updating request-scoped session information (e.g., fields attached to the Request object like `req.userId`, `req.user`, `req.session`):
- **Verify Middleware Definition**: Always cross-reference the middleware that signs/decodes tokens or manages sessions to confirm the exact type and structure of the field (e.g., string vs. object).
- **Match Controller Usage**: Ensure all controllers consume the field matching its exact type as defined/assigned in the middleware. Do not assume `req.userId` has a nested `.id` field unless explicitly defined as an object in the middleware.