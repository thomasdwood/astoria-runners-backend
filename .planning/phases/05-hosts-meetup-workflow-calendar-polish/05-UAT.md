---
status: complete
phase: 05-hosts-meetup-workflow-calendar-polish
source: 05-01-SUMMARY.md, 05-02-SUMMARY.md, 05-03-SUMMARY.md, 05-04-SUMMARY.md, 05-05-SUMMARY.md, 05-06-SUMMARY.md
started: 2026-03-14T00:00:00Z
updated: 2026-03-14T00:00:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running server/service. Clear ephemeral state (temp DBs, caches, lock files). Start the application from scratch. Server boots without errors, any seed/migration completes, and a primary query (health check, homepage load, or basic API call) returns live data.
result: pass

### 2. Hosts Management on Settings Page
expected: Go to Settings page. There should be a Hosts section with a table of hosts (name/email). Clicking "Add Host" opens a dialog where you can enter a name and optional email, then save. The new host appears in the table. Clicking delete on a host shows a confirmation dialog; confirming removes the host from the table.
result: pass

### 3. Meetup Description Template Editor
expected: On the Settings page, there should be a "Meetup Description Template" section with a textarea containing the current template and a list of available variables (like {{eventName}}, {{date}}, etc.). Editing the textarea and clicking Save persists the change — refreshing the page should show the saved template.
result: pass

### 4. Meetup URL Input (replacing checkbox)
expected: On the Events page, each one-off event row should have a Meetup button/icon. Clicking it opens a popover with a URL input field (not a checkbox). Entering a Meetup URL and saving updates the event — the row should then show a Meetup badge or indicator. Clearing the URL and saving removes the badge.
result: issue
reported: "button says 'Save as one off' and toast says 'Save as one off event' — exposes internal implementation detail (exception materialization) to the user when they just want to save a URL"
severity: minor

### 5. EventForm Category Filter + Host Selector
expected: When creating or editing a one-off event, the form should have a category dropdown above the route selector that filters available routes by category. There should also be a host selector dropdown. Selecting a category filters the route list; selecting a host associates that host with the event.
result: issue
reported: "When editing an existing event, the category filter doesn't prepopulate with the current route's category — user has to reselect it even though the route already implies a category. Also, events generated from recurring templates should default the host field to the template's host (overridable per-instance)."
severity: major

### 6. RecurringForm Host Selector
expected: When creating or editing a recurring template, the form should have a host selector dropdown (after the route selector). Selecting a host and saving associates that host with the recurring template.
result: pass

### 7. Cancel/Restore One-off Events
expected: On the Events page, active one-off event rows should have an X/cancel icon. Clicking it cancels the event — the row should show struck-through styling and a restore (↺) icon. Clicking the restore icon brings the event back to active state with normal styling.
result: pass

### 8. Calendar Popover — Host, Meetup, and Strava Links
expected: Click on a calendar event that has a host, Meetup URL, and/or Strava route assigned. The popover should show: a User icon with the host's name (if set), a "View on Meetup" link (if meetupUrl set), and a "View route on Strava" link (if the route has a stravaUrl). Events without these fields should not show the extra rows.
result: pass

### 9. Host and Meetup URL Persist on Event Save
expected: Create a new one-off event with a host selected and a Meetup URL entered. Save the event. Edit the event again — the host and Meetup URL fields should be pre-populated with the saved values. The event should also appear on the calendar popover with host name and Meetup link.
result: pass

## Summary

total: 9
passed: 7
issues: 2
pending: 0
skipped: 0

## Gaps

- truth: "When editing a single instance of a recurring event (any field — Meetup URL, route, etc.), the UI should communicate scope clearly without exposing implementation details"
  status: failed
  reason: "User reported: button says 'Save as one off' and toast says 'Save as one off event' — exposes internal concept (exception materialization) instead of communicating user intent. Should instead say 'Save URL' with a contextual note 'This will only apply to [date]. Future instances won't be affected.' This pattern applies to any per-instance edit, not just Meetup URL."
  severity: minor
  test: 4
  artifacts: []
  missing: []

- truth: "Category filter prepopulates with the current route's category when editing an existing event; events from recurring templates inherit the template's default host (overridable)"
  status: failed
  reason: "User reported: category filter doesn't prepopulate when editing an event (user must reselect even though route implies a category); events created from recurring templates should default host to the template's host"
  severity: major
  test: 5
  artifacts: []
  missing: []
