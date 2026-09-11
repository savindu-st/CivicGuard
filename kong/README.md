# Kong API Gateway Configuration

This directory contains the declarative configuration for Kong Gateway in DB-less mode.

## Routes Mapped

- `/api/incidents/*` ➔ `http://incident-service:4001`
- `/api/tickets/*` ➔ `http://ticket-service:4002`
- `/api/notifications/*` ➔ `http://notification-service:4003`
- `/api/relief/*` ➔ `http://relief-service:4004`
