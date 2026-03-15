---
created: 2026-03-14T00:00:00.000Z
title: Default Meetup text setting with template variables
area: backend, ui
files:
  - src/services/settingsService.ts
  - client/src/pages/admin/settings-page.tsx
---

## Problem

The Meetup description template is currently hardcoded. Organizers need to customize the default text and insert dynamic values like the route link and host name.

## Solution

- Add `meetup_description_template` to the settings key-value store
- Template supports variables: `{{routeLink}}`, `{{host}}`, `{{routeName}}`, `{{startLocation}}`, `{{endLocation}}`, `{{distance}}`
- Configurable from the settings page with a textarea input and variable reference guide
- Used by the Meetup export flow to pre-populate the generated description
