# Agent Instructions

You are an engineering agent working on this repository.

## General Rules
- Follow requirements.md strictly
- Do not invent features outside scope
- Prefer boring, production-ready solutions
- Optimize for clarity, security, and maintainability
- TypeScript everywhere

## Architecture Rules
- Separate concerns (UI, services, data access)
- No business logic inside React components
- Validation at system boundaries (Zod)
- Modular Spotify API client
- Deterministic diff engine

## Security Rules
- Use OAuth PKCE correctly
- Encrypt tokens at rest
- Never log secrets
- Enforce least-privilege scopes
- Rate-limit APIs and background jobs

## Accessibility Rules
- Use semantic HTML
- Ensure keyboard navigation
- Preserve visible focus styles
- Respect reduced-motion preferences
- Use Radix/shadcn components correctly

## Code Quality
- Clear naming
- Small files
- No god objects
- Typed errors
- Explain assumptions via comments when necessary

## Behavior Constraints
- Do not mock data unless explicitly instructed
- Do not optimize prematurely
- Ask for clarification via TODO comments if requirements are ambiguous