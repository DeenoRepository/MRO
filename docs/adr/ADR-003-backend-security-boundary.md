# ADR-003: Backend Is the Security Boundary

## Status

Accepted

## Context

The frontend is Angular and can hide/show UI elements based on user roles.

However, frontend checks can be bypassed.

## Decision

All real authorization must happen in backend using Spring Security.

Angular route guards are UX controls only.

## Consequences

Positive:

- stronger security;
- consistent API enforcement;
- safer integrations.

Negative:

- requires backend tests for permissions;
- requires explicit permission model.

## Agent Rule

Never implement authorization only in Angular.
