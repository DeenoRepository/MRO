# ADR-001: Use Modular Monolith

## Status

Accepted

## Context

The platform contains several related business domains:

- EPS
- MMS
- WMS
- SRS

These domains need transactional consistency and are expected to be developed by a relatively small team.

## Decision

Use a modular monolith.

One backend application contains all modules, with strict internal boundaries.

## Consequences

Positive:

- simpler deployment;
- simpler debugging;
- ACID transactions across modules;
- lower operational overhead;
- easier MVP delivery.

Negative:

- requires discipline to preserve module boundaries;
- scaling happens at application level first;
- careless imports can create coupling.

## Agent Rule

Do not convert this project to microservices unless explicitly instructed.
