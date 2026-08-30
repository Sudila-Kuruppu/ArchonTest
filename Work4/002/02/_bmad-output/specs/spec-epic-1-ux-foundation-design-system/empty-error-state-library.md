# Empty-State & Error-State Library

Companion to SPEC-epic-1-ux-foundation-design-system, supporting **CAP-7**. Each state below is a documented copy + recovery action pair. Implementers ship the exact copy (or the documented variants for parameterized cases); deviations need an explicit override through `composer test:banned` review.

## Board (Epic 3 owns the data; Epic 1 owns the chrome + copy)

| State | Copy | Recovery action |
|---|---|---|
| No listings yet | `No listings yet. Create your first one.` | CTA: Create Listing (FAB on mobile). |
| Category filter, no results | `No listings in {category}.` | `Clear filter` link. |
| Search, no matches | `No matches for {query}.` | `Clear search` link (copy includes the query so the user sees the right search ran). |
| Fetch fails | `Couldn't load listings. Tap to retry.` | Refresh icon button (no auto-retry). |

## My Tickets (Epic 4 owns the data; Epic 1 owns the chrome + copy)

| State | Copy | Recovery action |
|---|---|---|
| No tickets yet | `No tickets yet. Buy your first item.` | Link to Board. |

The empty state is per-tab (Active / Redeemed / Expired / Disputed) and per-first-visit; a returning user with no tickets in a tab still sees the actionable copy.

## Listing Modal (Epic 3 + 4 own the data; Epic 1 owns the chrome + copy)

| State | Copy | Recovery action |
|---|---|---|
| Out of stock (`quantity_sold == quantity`) | Buy Now button replaced with `Sold out` text; status badge shows `sold`. | None — read-only. |
| Self-owned listing | Buy Now button hidden; `Edit` + `Delete` actions visible; note `You own this listing.` appears above the seller row. | Edit / Delete. |
| Wrong redemption code, attempts 1-4 | Inline error `Code not recognized.` with counter `N of 5 attempts remaining`. | Continue retrying. |
| Wrong redemption code, attempt 5 (rate-limit NFR-SEC-007: 5/hr/ticket) | Field disabled for 1 hour; error `Too many attempts. Try again in 1 hour.` | Wait out the rate-limit window. |
| Already-redeemed code | `This ticket was already redeemed on {timestamp}.` | None — idempotent; no new state change, no error code thrown. |
| Redemption code for a ticket the user does not own | `Not authorized to redeem this ticket.` | None — security log entry written; redemption rejected. |

## Voice-and-tone discipline (cross-references CAP-6)

- **No emoji** in any empty or error state.
- **No encouragement filler** — `Looks like it's empty here!` is banned; `No listings yet. Create your first one.` is the rule.
- **Numbers carry units** where they appear; the `N of 5 attempts remaining` counter is the model.
- **Recovery action is always present** for states the user can act on; read-only states (sold out, already-redeemed, unauthorized) explicitly omit the action with no padding copy.
- **Short complete sentences with a period** — the toast / empty / error voice is consistent across the product.

## Per-state component recipe

Each empty/error state is implemented as a `.empty-state` or `.error-state` block:
- Centered, `surface-raised` fill (or transparent on the corkboard, matching the local surface).
- `display-md` for the headline copy, `body-md` for any subtext.
- Recovery action is a primary or secondary button / link depending on intent (primary for `Create Listing`, `Retry`; secondary for `Clear filter`, `Clear search`).
- `role="status"` on success / no-action states; `role="alert"` on error states.
- Reduced-motion safe: no slide-in, no pulse.

## Adoption by later epics

Every later epic that ships a surface capable of being empty or failing inherits this library. CAP-7 is the contract; an epic that ships a blank or generic "No data" state doesn't ship — it either uses one of the documented states or adds a new entry to this companion (with explicit review).
