# JobScraper — Online Job Aggregator Web App

**Document Version:** 1.0  
**Status:** Draft  
**Date:** 2026-06-05

---

## 1. Overview

JobScraper is a web-based job aggregation platform that enables university students and job seekers to search, filter, save, and export job listings from multiple online job boards (LinkedIn, Indeed, and others) through a single unified interface. The product eliminates the need to manually visit and query each board individually, consolidating results into one streamlined dashboard. The MVP delivers multi-board search, keyword/location filtering, saved listings with user accounts, and CSV/Excel export. Future phases add email alerts, scheduled scraping, advanced filters, and dark mode.

---

## 2. Problem Statement

University students and job seekers currently waste significant time manually checking multiple job boards (LinkedIn, Indeed, Glassdoor, etc.) for relevant openings. Each board has its own search interface, filters, and account system. There is no simple, no-code tool that aggregates, filters, and saves job listings from multiple sources in one place. This fragmentation leads to missed opportunities, duplicate effort, and a tedious job-hunting experience.

---

## 3. Target Users

| Segment | Description | Key Needs |
|---|---|---|
| **Primary** | University students searching for internships, part-time, and graduate roles | Quick discovery of entry-level roles across boards; save and compare opportunities |
| **Secondary** | General job seekers wanting to aggregate listings from multiple boards | Broad search across platforms; export for offline analysis |
| **Tertiary** | Anyone monitoring job postings across multiple platforms | Alerts for new postings; minimal friction for repeated use |

**User Characteristics:**
- Comfortable with web applications but not necessarily technical
- Value speed and simplicity over advanced features
- Often use the product on both desktop and mobile browsers
- Expect zero or very low cost for basic functionality [ASSUMPTION]

---

## 4. User Stories

1. As a job seeker, I want to search for jobs by keyword and location across multiple boards so that I can see all relevant openings in one place.
2. As a job seeker, I want to save/bookmark interesting job postings so that I can review them later.
3. As a job seeker, I want to receive alerts when new matching jobs are posted so that I never miss an opportunity.
4. As a job seeker, I want to export job listings to a spreadsheet so that I can analyze them offline.
5. As a user, I want to create an account so that my saved jobs and preferences persist across sessions.
6. As a job seeker, I want to view detailed information for each listing (title, company, location, description, URL) so that I can decide whether to apply.
7. As a user, I want to filter results by salary range, date posted, and job type so that I can narrow down the most relevant opportunities. [P1 — deferred to Phase 3]
8. As a job seeker, I want to schedule automatic daily scraping so that I always have fresh results without manual re-searching. [P1 — deferred to Phase 2]
9. As a user, I want to use the application with a dark mode theme so that it is comfortable to use in low-light environments. [P1 — deferred to Phase 3]

---

## 5. Functional Requirements

### P0 — MVP (Must-Have)

| # | Requirement | Priority |
|---|---|---|
| FR-01 | The system shall search for jobs across 3+ job boards (LinkedIn, Indeed, and at least one more such as Glassdoor or SimplyHired) in a single query. | P0 |
| FR-02 | The system shall accept keyword and location input from the user for search queries. | P0 |
| FR-03 | The system shall display search results in a unified list with title, company, location, and a link to the original posting. | P0 |
| FR-04 | The system shall allow users to save/bookmark an unlimited number of job listings to a personal collection. | P0 |
| FR-05 | The system shall support user registration and login to persist saved jobs and preferences. | P0 |
| FR-06 | The system shall allow users to export search results or saved listings to CSV and Excel formats. | P0 |
| FR-07 | The system shall surface errors gracefully when a specific job board is unreachable or returns no results. | P0 |

### P1 — Nice-to-Have

| # | Requirement | Priority |
|---|---|---|
| FR-08 | The system shall send email notifications when new jobs matching saved search criteria are found. | P1 |
| FR-09 | The system shall support scheduled auto-scraping (e.g., daily or weekly) on saved searches. | P1 |
| FR-10 | The system shall provide advanced filters including salary range, date posted, and job type (full-time, part-time, internship, contract). | P1 |
| FR-11 | The system shall offer a dark mode toggle in the UI. | P1 |

### P2 — Future

| # | Requirement | Priority |
|---|---|---|
| FR-12 | The system shall allow users to upload a resume to auto-fill search criteria or applications. | P2 |
| FR-13 | The system shall provide application tracking (e.g., applied, interview, offer, rejected statuses). | P2 |
| FR-14 | The system shall be fully responsive on mobile devices. | P2 |

---

## 6. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | Search results shall return within 10 seconds for a query across all configured boards. |
| **Performance** | The system shall cache results for a configurable TTL to avoid redundant scraping. [ASSUMPTION] |
| **Scalability** | The system shall support up to 1,000 concurrent users in the MVP phase. [ASSUMPTION] |
| **Scalability** | The scraping layer shall handle rate limiting and backpressure from each job board independently. |
| **Reliability** | The system shall have 99.5% uptime for core search and save functionality during business hours (8 AM – 10 PM). [ASSUMPTION] |
| **Security** | User passwords shall be hashed and salted (bcrypt or equivalent). |
| **Security** | All traffic shall be served over HTTPS. |
| **Security** | API keys or tokens for job board access shall be stored server-side, never exposed to the client. |
| **Usability** | The UI shall be navigable with keyboard-only input. [ASSUMPTION] |
| **Usability** | The interface shall require no more than three clicks to complete a search. [ASSUMPTION] |
| **Maintainability** | Adding a new job board source shall require changes to only one module/configuration file. [ASSUMPTION] |

---

## 7. Success Metrics

| Metric | Target |
|---|---|
| Number of supported job boards | ≥ 3 at launch |
| Search result latency (p95) | ≤ 10 seconds |
| User registration rate | [ASSUMPTION] ≥ 50% of weekly active users |
| Saved jobs per registered user (weekly) | [ASSUMPTION] ≥ 5 |
| Export success rate | 100% of export attempts generate a valid file |
| Saved listings per user | Unlimited (no artificial cap on bookmarks) |
| Daily active users (3 months post-launch) | [ASSUMPTION] ≥ 500 |
| User satisfaction score (post-search survey) | [ASSUMPTION] ≥ 4.0 / 5.0 |

---

## 8. Scope

### In Scope

- Multi-board job search (LinkedIn, Indeed, +1 additional board)
- Keyword and location filtering
- Unified job results display with title, company, location, description snippet, and source link
- User accounts (registration, login, logout, password reset) [ASSUMPTION — adds password reset]
- Save/bookmark job listings per user
- Export to CSV and Excel
- Email alerts for new matching jobs (P1 — included as enhancement phase)
- Scheduled auto-scraping (P1)
- Advanced filters — salary, date posted, job type (P1)
- Dark mode UI toggle (P1)
- Responsive web design for desktop and tablet (P2 mobile deferred)

### Out of Scope

- Auto-apply to jobs
- Resume builder
- AI-driven matching or recommendations
- Native mobile application (iOS/Android)
- Resume upload and auto-fill (P2 — deferred)
- Application tracking (P2 — deferred)
- Job posting directly on the platform

---

## 9. Timeline

| Phase | Milestone | Contents | Estimated Date |
|---|---|---|---|
| **Phase 1 — MVP** | Core search & save | FR-01 through FR-07; user accounts, search, save, export | Launch + 8 weeks [ASSUMPTION] |
| **Phase 2 — Alerts & Scheduling** | Notification engine | FR-08, FR-09; email alerts, scheduled scraping | MVP + 4 weeks [ASSUMPTION] |
| **Phase 3 — Advanced UX** | Richer filters & theming | FR-10, FR-11; salary/date/type filters, dark mode | Phase 2 + 3 weeks [ASSUMPTION] |
| **Phase 4 — Polish & Scale** | Performance & mobile | FR-14; mobile responsiveness, performance tuning, load testing | Phase 3 + 4 weeks [ASSUMPTION] |
| **Phase 5 — Future** | Resume & tracking | FR-12, FR-13; resume upload, application tracking | TBD (post-launch evaluation) |

---

## 10. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| Job boards deploy anti-scraping measures (rate limiting, CAPTCHAs, IP blocks) | High — core search breaks | High | Use rotating proxies, exponential backoff, respect robots.txt; consider using official APIs where available |
| Changes to job board HTML structure or API endpoints | High — scraping fails for a source | Medium | Abstract scraper behind a parser interface; monitor scrapers with health checks; implement quick-switch fallback |
| Terms of Service violations for scraping | Medium — legal exposure | Medium | Review ToS for each board; prefer official APIs; include a configurable delay; provide opt-out mechanism [ASSUMPTION] |
| Low adoption due to search latency | Medium — user churn | Medium | Aggressive caching; show partial results as they arrive; set clear user expectations with loading states |
| User data breach | Critical — reputational + legal damage | Low | Follow OWASP guidelines; encrypt PII at rest; regular security audits; minimal data collection principle |

---

## 11. Open Questions

1. **Scraping approach** — Should the scraper use headless browsers (Puppeteer/Playwright) or lightweight HTTP requests (axios/cheerio)? Headless browsers are more robust against JS-rendered pages but consume more resources.
2. **Caching strategy** — Should we cache search results server-side to avoid redundant scraping? What TTL is appropriate (e.g., 1 hour for active searches, 24 hours for stale)?
3. **Export formats** — Beyond CSV and Excel, are JSON, PDF, or TSV exports desirable?
4. **Email infrastructure** — Should we use a third-party email service (SendGrid, SES) or build in-house? What are the cost implications at scale?
5. **Job board priority** — Which third board should be added after LinkedIn and Indeed? Candidates: Glassdoor, SimplyHired, Monster, ZipRecruiter.
6. **Free vs. paid model** — Should the product be free, freemium (e.g., free search + paid alerts), or subscription-based? [ASSUMPTION — free MVP with potential premium tier for alerts/scheduling]
7. **Rate limit thresholds** — What are the acceptable scraping rates per board to avoid being blocked while maintaining freshness?
8. **Geographic scope** — Should the initial release target a specific country/region, or be globally available? [ASSUMPTION — US/Canada initial, expandable]

---

## 12. Assumptions and Constraints

The following assumptions are documented across the PRD. They represent known unknowns that should be validated before or during development.

### Business & User Assumptions

| # | Assumption | Source |
|---|---|---|
| A-01 | Users expect zero or very low cost for basic functionality | Section 3 — User Characteristics |
| A-02 | Free MVP with potential premium tier for alerts/scheduling | Section 11 — Open Question 6 |
| A-03 | US/Canada initial geographic scope, expandable | Section 11 — Open Question 8 |
| A-04 | Password reset flow is included in user account MVP scope | Section 8 — Scope In Scope |

### Technical & Performance Assumptions

| # | Assumption | Source |
|---|---|---|
| A-05 | Search results cached server-side with configurable TTL | Section 6 — NFR |
| A-06 | System supports up to 1,000 concurrent users in MVP | Section 6 — NFR |
| A-07 | 99.5% uptime for core search/save during business hours (8 AM – 10 PM) | Section 6 — NFR |
| A-08 | UI navigable with keyboard-only input | Section 6 — NFR |
| A-09 | No more than three clicks to complete a search | Section 6 — NFR |
| A-10 | Adding a new job board source requires changes to only one module | Section 6 — NFR |

### Adoption & Success Assumptions

| # | Assumption | Source |
|---|---|---|
| A-11 | ≥ 50% of weekly active users will register | Section 7 — Success Metrics |
| A-12 | ≥ 5 saved jobs per registered user per week | Section 7 — Success Metrics |
| A-13 | ≥ 500 daily active users at 3 months post-launch | Section 7 — Success Metrics |
| A-14 | ≥ 4.0/5.0 user satisfaction score | Section 7 — Success Metrics |

### Timeline Assumptions

| # | Assumption | Source |
|---|---|---|
| A-15 | MVP deliverable in 8 weeks with a suitable team | Section 9 — Timeline |
| A-16 | Phase 2 (alerts & scheduling) deliverable in 4 weeks post-MVP | Section 9 — Timeline |
| A-17 | Phase 3 (advanced UX) deliverable in 3 weeks post-Phase 2 | Section 9 — Timeline |
| A-18 | Phase 4 (polish & scale) deliverable in 4 weeks post-Phase 3 | Section 9 — Timeline |

### Legal & Risk Assumptions

| # | Assumption | Source |
|---|---|---|
| A-19 | Terms of Service allow scraping with configurable delays and opt-out | Section 10 — Risks |
| A-20 | Job boards do not deploy breaking anti-scraping measures that cannot be mitigated | Section 10 — Risks |
| A-21 | Rotating proxies and exponential backoff are sufficient to avoid IP blocks | Section 10 — Risks |
