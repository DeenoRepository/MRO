# ADR-002: Use PostgreSQL Schemas for Module Isolation

## Status

Accepted

## Context

The platform requires strong consistency across modules, but also needs clear data ownership.

## Decision

Use one PostgreSQL database with separate schemas:

- core
- eps
- mms
- wms
- srs
- audit
- reporting

## Consequences

Positive:

- simpler backup and restore;
- cross-module transactions remain possible;
- clear logical isolation;
- easier reporting.

Negative:

- requires careful grants and migration discipline;
- modules must not bypass service boundaries casually.

## Agent Rule

Do not create separate databases per module in MVP.
