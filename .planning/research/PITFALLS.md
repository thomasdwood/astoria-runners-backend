# Pitfalls Research

**Domain:** Event Scheduling and Run Club Management
**Researched:** 2026-02-12
**Confidence:** MEDIUM-HIGH

## Critical Pitfalls

### Pitfall 1: Concurrent Edit Conflicts Without Proper Locking

**What goes wrong:**
Multiple organizers editing the same event simultaneously causes data overwrites and lost changes. One organizer's changes silently overwrite another's, leading to confusion, incorrect event details, or deleted information reappearing.

**Why it happens:**
Many simple database setups lack concurrency control mechanisms. Developers assume edits will be sequential or use "last write wins" semantics without user awareness. The Google Sheets failure mode described in the project context is a classic example of this pitfall.

**How to avoid:**
Implement optimistic locking with version fields on each record. When an update occurs, verify the version hasn't changed since the read. If it has, reject the update and prompt the user to refresh and retry. For real-time collaboration, consider operational transformation or CRDTs (Conflict-free Replicated Data Types) for automatic conflict resolution.

**Warning signs:**
- Users report changes "disappearing" or being "undone"
- Complaints about having to re-enter information
- Events reverting to old states
- Organizers mention they avoid editing simultaneously

**Phase to address:**
Phase 1 (Foundation) - Must be built into the data model from day one. Retrofitting concurrency control is extremely difficult.

---

### Pitfall 2: Timezone Mishandling and DST Transitions

**What goes wrong:**
Events scheduled during DST transitions show incorrect times or fail to save. Run clubs with members in multiple timezones see confusing event times. Events scheduled at "2:30 AM" during spring-forward DST simply don't exist. Static UTC offsets (e.g., UTC-5) break during DST transitions, causing events to be off by an hour.

**Why it happens:**
Developers store static offset values instead of IANA timezone names. Using abbreviated forms like "EST" instead of "America/New_York" prevents automatic DST handling. Calculating offsets manually (e.g., DATEADD(hour, -5)) fails during DST transitions.

**How to avoid:**
- Always store timestamps in UTC
- Store IANA timezone identifier (e.g., "America/New_York") separately, never abbreviations
- Convert to user's local time only at display time
- Validate that scheduled times exist (detect DST gaps)
- Warn users scheduling events during DST transition windows

**Warning signs:**
- Bug reports in March and November (DST transition months)
- Events showing times one hour off
- Complaints from users in different states/countries
- Events failing to save at specific times

**Phase to address:**
Phase 1 (Foundation) - Core data model must use UTC + timezone identifier pattern from the start.

---

### Pitfall 3: No-Show Cascade Leading to Event Cancellations

**What goes wrong:**
Free events with simple RSVPs experience 50%+ no-show rates. Organizers plan for RSVP count, under-prepare, or worst case, cancel events due to perceived low interest when actual attendance would have been sufficient.

**Why it happens:**
No financial or social commitment for free RSVPs. Single RSVP action weeks before event with no follow-up. No tracking of repeat no-show patterns. Lack of waitlist psychology (people who get off waitlists are more likely to attend).

**How to avoid:**
- Implement RSVP confirmation system (require re-confirmation 24-48 hours before event)
- Track individual attendance history and flag repeat no-shows
- Use waitlist system even for free events (creates perceived scarcity)
- Send automated reminders at 7 days, 3 days, and 24 hours before event
- Calculate expected attendance using historical no-show rates (not raw RSVP count)
- Display "X confirmed attending" vs "Y RSVPed" separately

**Warning signs:**
- Consistent reports of "we had 50 RSVPs but only 20 showed up"
- Events being cancelled despite RSVPs
- Organizers expressing frustration with attendance
- Excessive supply preparation/waste

**Phase to address:**
Phase 2 (RSVP & Attendance Tracking) - Core RSVP in Phase 1, but sophisticated tracking and prediction requires its own phase.

---

### Pitfall 4: Public Calendar Security Exposure

**What goes wrong:**
Public calendars get indexed by search engines, exposing sensitive information. Event details reveal organizer patterns (home addresses from recurring runs, personal schedules, participant email addresses), creating security and privacy risks. Google and other search engines can index "public" calendars, making them discoverable without sharing links.

**Why it happens:**
"Public viewing without authentication" requirement is implemented too broadly. Developers conflate "authenticated viewing" with "requires login" rather than using secret links. Lack of understanding that "public" can mean "indexed by search engines."

**How to avoid:**
- Use unguessable secret URLs for public viewing instead of truly "public" endpoints
- Implement read-only sharing via capability-based security (secret token in URL)
- Control what metadata is visible to different audience tiers
- Add robots.txt and noindex meta tags to calendar pages
- Separate "organizer view" (full details) from "public view" (sanitized details)
- Never expose email addresses or full names in public views

**Warning signs:**
- Calendar pages appearing in Google search results
- Participants receiving spam after event attendance
- Concerns raised about privacy by members
- Event URLs containing sequential IDs (easy to enumerate)

**Phase to address:**
Phase 1 (Foundation) - Security model must be designed upfront. Adding security later requires data migration and breaking existing links.

---

### Pitfall 5: Webhook Integration Death Spiral

**What goes wrong:**
Strava/Discord webhooks fail due to rate limits, expired certificates, or server errors. After repeated failures, the external service stops sending webhooks entirely. No visibility into failure state. Integration appears "broken" but root cause is unclear.

**Why it happens:**
Discord webhooks limited to 5 requests per 2 seconds (or 30 per 60 seconds). Strava stops sending to endpoints that repeatedly return errors. Webhook receivers don't implement retry logic or error handling. Certificate expiration not monitored. No logging or alerting for failed webhook deliveries.

**How to avoid:**
- Implement webhook queue with rate limiting (stay well under Discord/Strava limits)
- Use exponential backoff for retries
- Return 200 OK immediately, process webhooks asynchronously
- Monitor SSL certificate expiration
- Log all webhook receipts and failures
- Implement webhook "health check" dashboard
- Have manual re-sync mechanism for when webhooks fail
- Don't retry 404 responses (indicates deleted webhook)

**Warning signs:**
- Strava activities not appearing in Discord
- "Integration stopped working" reports without code changes
- Burst of activity causing delayed or missing updates
- Webhook endpoint returning errors in logs
- SSL certificate expiration warnings

**Phase to address:**
Phase 3 (External Integrations) - Must be designed with reliability patterns from the start, but can be built after core functionality is solid.

---

### Pitfall 6: Recurring Event Architectural Trap

**What goes wrong:**
Editing one instance of recurring event series modifies all instances. Or, attempting to delete a single occurrence deletes the entire series. Members can't handle exceptions (e.g., "Tuesday run meets at park A normally, but next Tuesday at park B").

**Why it happens:**
Database schema stores single record with recurrence rule instead of individual instances. Simplifies storage but prevents instance-level customization. Many calendar platforms simply don't support editing single instances of true recurring events.

**How to avoid:**
Use "event series" pattern instead of "recurring events":
- Store recurrence template separately from actual instances
- Generate individual event instances from template
- Allow instances to be customized after generation
- Track which instances are "exceptions" (modified from template)
- Provide "update all future" option separate from "update this instance"
- Allow deletion of single instances without breaking series

**Warning signs:**
- Requests for "one-off changes" to recurring events
- Confusion about what "edit this event" will affect
- Need to cancel recurring series and recreate to handle exceptions
- Bug reports about "deleted event came back"

**Phase to address:**
Phase 1 (Foundation) - Data model decision that's extremely difficult to change later. Must get right from the start.

---

### Pitfall 7: GPX File Corruption and Metadata Loss

**What goes wrong:**
Route GPX files become corrupted during upload, storage, or download. Files won't open in GPS software or display incorrect/missing route data. Metadata (route name, description, waypoints) lost or garbled. Files fail to import with cryptic "metadata block problem" errors.

**Why it happens:**
GPX is XML-based and sensitive to structural errors. File uploads interrupted by network issues. Character encoding problems (non-UTF8 data). Invalid coordinate values or malformed XML tags. Storage system doesn't validate GPX structure. Re-encoding or processing corrupts original data.

**How to avoid:**
- Validate GPX structure immediately on upload (XML schema validation)
- Check for required elements (at minimum: track points with lat/lon/elevation)
- Sanitize and validate coordinate values (valid lat/lon ranges)
- Store original uploaded file + processed/validated version
- Use Content-MD5 or checksums to verify upload integrity
- Test GPX files with multiple parsers/tools before accepting
- Provide GPX repair tool for common issues
- Keep upload logs for debugging corruption issues

**Warning signs:**
- Users report routes "don't work" in their GPS device
- Files download but won't open in mapping software
- Routes missing points or showing in wrong locations
- Complaints about lost route descriptions or waypoints
- Increased support requests around GPX functionality

**Phase to address:**
Phase 1 (Foundation - PDF/GPX Extraction) - Critical to handle correctly from day one since corrupted files can't be recovered.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using local timestamps instead of UTC | Simpler initial implementation | Timezone bugs, DST failures, impossible to fix later | Never - always use UTC |
| Last-write-wins conflict resolution | No concurrency code needed | Data loss, user frustration, impossible to debug | Never for multi-editor system |
| Storing event series as single DB record | Less storage, simpler queries | Cannot edit individual instances, forces rewrites | Only if truly read-only recurring events |
| Basic RSVP without confirmation | Faster MVP launch | 50%+ no-show rates, poor planning data | Acceptable for MVP if flagged for Phase 2 |
| Sequential/guessable event IDs | Simple auto-increment IDs | Security exposure, enumeration attacks | Never for public calendar system |
| Synchronous webhook processing | Simple request/response flow | Rate limiting, timeouts, webhook death spiral | Never - always queue webhooks |
| Client-side only timezone conversion | Less backend complexity | Inconsistent display, wrong times in notifications | Never - timezone conversion must be server-authoritative |
| Storing GPX files without validation | Faster upload flow | Corrupted files, user complaints, data loss | Never - validation is critical |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Discord Webhooks | Sending all updates immediately | Queue webhooks, batch updates, respect 5 req/2sec limit |
| Strava API | Not handling webhook deactivation | Monitor webhook health, implement manual re-sync fallback |
| Discord/Strava | Storing credentials in code/environment | Use secrets manager, rotate credentials, implement OAuth refresh |
| Public Calendar Sharing | Making calendar truly "public" | Use secret tokens in URLs, implement capability-based security |
| GPX Import | Trusting uploaded file content | Validate XML structure, sanitize coordinates, check file size limits |
| External Calendar Sync (Google, Outlook) | Syncing bidirectionally | Read-only import to avoid sync conflicts and data corruption |
| Webhook Receivers | Returning errors on validation failure | Return 200 OK immediately, validate/process asynchronously |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading all event instances for calendar view | Slow page loads, high DB load | Paginate, load only visible date range, use indexes on date fields | 100+ events or recurring events with many instances |
| Regenerating recurring events on every view | Database write operations on read | Pre-generate instances, cache, regenerate only when series changes | 10+ active recurring series |
| Synchronous GPX parsing on upload | Request timeouts, locked UI | Process uploads in background job, show progress indicator | Files > 1MB or routes with thousands of points |
| N+1 queries for attendee lists | Slow event list pages | Eager load attendees with events, use JOIN queries | 20+ events with 5+ attendees each |
| Sending individual webhook per activity | Rate limiting, delayed updates | Batch updates, queue webhooks, implement backoff | 10+ simultaneous activities |
| Real-time recalculation of attendance stats | Dashboard slowdown | Cache statistics, update on write not read | 50+ events with RSVPs |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Sequential event IDs in public URLs | Enumeration of all events, privacy leak | Use UUIDs or random tokens for public-facing IDs |
| Exposing participant emails in public view | Spam, privacy violation, GDPR issue | Show only first name + last initial in public views |
| No rate limiting on RSVP endpoints | RSVP spam, fake attendees, DOS | Implement rate limiting, CAPTCHA for public RSVPs |
| Storing GPX files without size limits | Storage exhaustion, DOS attacks | Enforce file size limits (e.g., 5MB max), validate point counts |
| Secret tokens in query params logged | Token leakage in server logs, analytics | Use authorization headers or POST bodies for secrets |
| Webhook endpoints without signature verification | Fake webhook attacks, data corruption | Validate Discord/Strava webhook signatures |
| No access control on route deletion | Malicious deletion, data loss | Require authentication + ownership verification |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing timezone-naive times | Confusion about event times, missed events | Always display timezone, convert to user's local time |
| No visual indication of concurrent edits | Lost work, confusion | Show "X is editing" indicators, warn before overwriting |
| Deleting recurring event deletes all without warning | Data loss, panic, restore requests | Show "Delete this instance / this and future / all instances" dialog |
| RSVP appears instant but no confirmation shown | User unsure if action succeeded | Show immediate feedback + confirmation message |
| No way to track "maybe" or "interested" separately from committed RSVP | Inflated no-show rates | Offer "Interested / Going / Can't Go" options |
| Calendar cluttered with all past events | Hard to find relevant information | Auto-archive old events, provide "upcoming only" default view |
| No indication of route difficulty or distance | Wrong participant expectations, safety issues | Display elevation gain, distance, pace, difficulty rating |
| Missing "add to my calendar" export | Users manually recreate events, errors | Provide iCal/ICS export for individual events |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **RSVP System:** Often missing confirmation workflow — verify 24-hour pre-event confirmation exists
- [ ] **Timezone Handling:** Often missing DST validation — verify events can't be scheduled during spring-forward gap hours
- [ ] **Concurrent Edits:** Often missing conflict detection — verify version field exists and is checked on updates
- [ ] **Webhooks:** Often missing retry logic — verify failed webhooks are queued and retried with backoff
- [ ] **Public Calendar:** Often missing robots.txt — verify search engines can't index calendar pages
- [ ] **GPX Upload:** Often missing validation — verify corrupted/invalid files are rejected with helpful errors
- [ ] **Recurring Events:** Often missing instance-level editing — verify single occurrence can be modified without affecting series
- [ ] **Event Deletion:** Often missing soft-delete — verify deleted events can be recovered (audit trail)
- [ ] **RSVP Limits:** Often missing waitlist — verify capacity limits trigger waitlist not hard rejection
- [ ] **Attendance History:** Often missing per-user tracking — verify system tracks who actually shows up vs who RSVPs

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Concurrent edit data loss | MEDIUM | Check database audit logs or backups, manually merge lost changes, notify affected organizers |
| DST time display bug | LOW | Update display logic to use IANA timezones, communicate correct times to affected participants |
| No-show cascade event cancellation | LOW | Implement confirmation system going forward, manually contact waitlist for current event |
| Public calendar indexed | HIGH | Request Google de-indexing, change all URLs with secret tokens, notify users of privacy exposure |
| Webhook death spiral | MEDIUM | Check certificate validity, clear error queue, manually re-register webhooks with Strava/Discord |
| Recurring series deleted | HIGH | Restore from backup if available, otherwise recreate series manually, notify participants |
| GPX corruption | MEDIUM-HIGH | Request original file from user, attempt XML repair, provide working file if available |
| Sequential ID enumeration | HIGH | Migrate to UUIDs (breaking change), audit for exposed data, notify affected users |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Concurrent Edit Conflicts | Phase 1 (Foundation) | Test: two users edit same event simultaneously, verify conflict detection |
| Timezone/DST Handling | Phase 1 (Foundation) | Test: schedule event during DST transition, verify warning/prevention |
| Public Calendar Security | Phase 1 (Foundation) | Test: verify Google cannot index calendar pages, URLs contain unguessable tokens |
| GPX File Corruption | Phase 1 (Foundation) | Test: upload invalid GPX file, verify rejection with helpful error |
| Recurring Event Architecture | Phase 1 (Foundation) | Test: edit single instance of recurring series, verify others unchanged |
| No-Show Management | Phase 2 (RSVP/Attendance) | Test: track user with 3 no-shows, verify flagged; verify confirmation reminders sent |
| Webhook Reliability | Phase 3 (Integrations) | Test: webhook endpoint returns 500, verify retry with backoff; send burst of 20 webhooks, verify rate limiting |
| Performance at Scale | Phase 4 (Scale/Polish) | Test: create 200 events with recurring series, verify calendar loads in <2 seconds |

## Sources

### Event Scheduling & Management
- [12 Event Planning Problems and Solutions (2026)](https://www.eventtia.com/en/6-common-event-management-mistakes-and-what-to-do-instead/)
- [Common Event Planning Mistakes and How to Avoid Them](https://www.eventdex.com/blog/common-event-planning-mistakes-and-how-to-avoid-them/)
- [Avoid the 10 Common Scheduling Mistakes - Calendar App](https://www.calendar.com/blog/avoid-the-10-common-scheduling-mistakes/)

### Run Club & Membership Management
- [Top 10 Sports Club Management Software Providers](https://www.waresport.com/blog/top-10-sports-club-management-software-all-in-one-2026)
- [Club Automation Reviews](https://www.softwareadvice.com/club-management/club-automation-profile/reviews/)

### Concurrent Editing & Conflicts
- [Calendar Conflicts and Free/Busy Status | Calendly Community](https://community.calendly.com/how-do-i-40/calendar-conflicts-and-your-calendar-s-free-busy-status-653)
- [Fixing a Race Condition](https://medium.com/in-the-weeds/fixing-a-race-condition-c8b475fbb994)
- [Conflict Resolution in Real-Time Collaborative Editing](https://tryhoverify.com/blog/conflict-resolution-in-real-time-collaborative-editing/)
- [Understanding Optimistic Locking](https://medium.com/@gaddamnaveen192/understanding-optimistic-locking-a-key-to-handling-data-conflicts-63c086b850d5)
- [Optimistic Concurrency for Pessimistic Times](https://event-driven.io/en/optimistic_concurrency_for_pessimistic_times/)

### Timezone & DST Issues
- [Understanding Daylight Saving Time (DST) and How Rails Handles It](https://medium.com/@kabirpathak99/understanding-daylight-saving-time-dst-and-how-rails-handles-it-be218bb1ecd8)
- [Handling Daylight Saving Time in Applications](https://www.datetimeapp.com/learn/handling-daylight-saving-time)
- [Dealing with Daylight Saving Time - The Events Calendar](https://theeventscalendar.com/knowledgebase/how-daylight-saving-time-affects-events-2/)

### RSVP & No-Shows
- [How to Reduce Your Event RSVP No-Show Rate](https://www.glueup.com/blog/fix-high-event-rsvp-no-show-rate)
- [Common RSVP Event Management Mistakes (2025)](https://www.socioplace.com/blogs/common-rsvp-event-management-mistakes-and-how-to-avoid-them-in-2025)
- [No-Show Prevention 101](https://thebelltoweron34th.com/blog/minimizing-no-shows-at-your-next-event/2024/2/26)

### Security & Privacy
- [Calendar Security 101 - Calendar.com](https://www.calendar.com/blog/calendar-security-101-protecting-your-schedules-and-personal-information/)
- [Google Calendars Leaking Private Information](https://www.systoolsgroup.com/blog/google-calendars-are-exposing-your-private-information-online/)
- [Google Calendar Settings Exposes Users' Meetings](https://threatpost.com/google-calendar-settings-gaffes-exposes-users-meetings-company-details/148384/)

### Webhooks & Integration
- [Rate Limits - Discord Webhooks Guide](https://birdie0.github.io/discord-webhooks-guide/other/rate_limits.html)
- [Strava Developers - Webhooks](https://developers.strava.com/docs/webhooks/)
- [Guide to Discord Webhooks Features and Best Practices](https://hookdeck.com/webhooks/platforms/guide-to-discord-webhooks-features-and-best-practices)

### GPX Files
- [GPX files are sometimes corrupted · Issue #530](https://github.com/mendhak/gpslogger/issues/530)
- [How to Fix Corrupted GPX Files](https://www.gpxanalyzer.com/guides/how-to-fix-corrupted-gpx-files.html)
- [Function "Add -> Import Route" fails for many gpx files](https://support.hammerhead.io/hc/en-us/community/posts/9417815113115-Function-Add-Import-Route-fails-for-many-gpx-files)

### Recurring Events
- [Recurring Events vs Event Series - AddEvent](https://www.addevent.com/c/help/article/204/recurring-events-vs-an-event-series)
- [How to edit a single instance of a recurring event](https://theeventscalendar.com/knowledgebase/how-to-edit-a-single-instance-of-a-recurring-event/)
- [Deleting a single event deletes entire recurring series](https://theeventscalendar.com/support/forums/topic/deleting-a-single-event-deletes-entire-recurring-series/)

---
*Pitfalls research for: Astoria Runners - Run Club Planning Tool*
*Researched: 2026-02-12*
