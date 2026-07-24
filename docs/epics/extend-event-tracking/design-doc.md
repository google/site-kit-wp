# **\[SK\] Content as a Business — Frontend Event Tracking Design**

| Reviewer | Role | Status | Last Change |
| :---- | :---- | :---- | :---- |
| TBD | Approver | Not started | Date |
| TBD | Approver | Not started | Date |
| [Eugene Manuilov](mailto:eugene.manuilov@fueled.com) | Author | In Progress | Jul 24, 2026 |

***Visibility:** Confidential*
***Status:*** *Draft*
***Author(s):** [Eugene Manuilov](mailto:eugene.manuilov@fueled.com)*
***PRD:** Content as a Business (mini‑epic)*
***FE Tracking Spec:** [`frontend-event-tracking.md`](./frontend-event-tracking.md) — the locked, agreed list of exactly what we track, the GA event names, and known coverage limitations. This design doc explains **how** we implement that spec.*
***Last Major Revision:** Jul 24, 2026*

# **Context**

## **Objective**

Extend Site Kit's existing Conversion Tracking so it captures five **generic, content‑focused engagement events** from the site frontend — events that are **not tied to any third‑party plugin** and that either aren't covered, or aren't covered accurately, by GA4 Enhanced Measurement.

## **Background**

Site Kit already injects small frontend snippets that report user actions to Google Analytics/Ads through the Conversion Tracking pipeline in `includes/Core/Conversion_Tracking/`. Every provider we ship today (WooCommerce, Contact Form 7, Easy Digital Downloads, Mailchimp, Ninja Forms, OptinMonster, Popup Maker, WPForms) is **gated on a specific plugin being active** (`is_active()` checks a plugin constant/class) and reports **lead** or **e‑commerce** conversions.

The "Content as a Business" mini‑epic wants to measure how visitors engage with *content itself*, regardless of which plugins a site runs:

1. **Reading an entire article** — GA4 Enhanced Measurement's `scroll` (90%) is page‑type‑agnostic (it fires on the home page, archives, pages, CPTs), so the signal is polluted and it counts anyone who *jumps* to the bottom. We want a stricter, single‑post‑only signal that also requires dwell time.
2. **Embedded video views** — Enhanced Measurement tracks YouTube only when the embed exposes the JS API, which WordPress oEmbed does not add; Vimeo is not covered at all.
3. **Within‑article pagination clicks** — not covered by Enhanced Measurement.
4. **Tel / email link clicks** — inconsistently attributed by Enhanced Measurement.
5. **Qualified outbound link clicks** (`rel="sponsored"|"ugc"|"nofollow"`) — Enhanced Measurement records generic outbound clicks but never the `rel` qualification.

The full list of triggers, final GA event names, suggested params, and coverage limitations is **already agreed** in [`frontend-event-tracking.md`](./frontend-event-tracking.md); this document does not re‑litigate them. It describes the technical approach for delivering them on top of the current infrastructure.

# **Design**

## **Overview**

We reuse the existing Conversion Tracking pipeline end‑to‑end and add a **single, always‑available "Content Events" provider** that sits alongside the plugin‑gated providers, plus **one frontend script** that wires up all five events.

Concretely:

- A new PHP provider `Content_Events` extends the existing `Conversion_Events_Provider` base. Unlike the plugin providers, its `is_active()` is **not** gated on a third‑party plugin — it is "active" whenever the feature flag is on. Per‑event gating (page type, element presence, provider presence such as bbPress) happens **inside** its hooks and its frontend script.
- The provider registers **one** frontend entry, `googlesitekit-events-provider-content-events`, that attaches all the client‑side listeners/observers and fires events through the **existing** `window._googlesitekit.gtagEvent( name, data )` helper — so every event is automatically de‑duped/throttled and stamped `event_source: 'site-kit'`.
- The provider's PHP `register_hooks()` handles the server‑side pieces the frontend can't do on its own: appending the end‑of‑content anchor, injecting `enablejsapi=1` into YouTube oEmbeds, detecting Vimeo iframes and conditionally enqueuing the Vimeo Player SDK, and passing per‑page config (post ID, word count, reading‑time constants, page‑type flags) to the script.

Because these are engagement events rather than lead/e‑commerce conversions, the provider is deliberately kept **out of the existing conversion‑event enumerations** (see [Keeping content events separate](#keeping-content-events-separate)), so nothing leaks into the Ads conversion labels or ACR's detected‑event logic.

### Data flow

```
                        wp_enqueue_scripts (priority 30)
Conversion_Tracking::maybe_enqueue_scripts()
  ├─ precondition: Conversion Tracking enabled  AND
  │                a GA4/Ads web tag was injected (did_action init_tag)
  ├─ enqueue each active provider's script  ──►  content-events.js
  └─ inject window._googlesitekit.gtagEvent(name, data)  (throttle + event_source:'site-kit')

Content_Events::register_hooks()  (PHP)
  ├─ the_content            → append end-of-content anchor (single posts)
  ├─ embed_oembed_html /    → add enablejsapi=1 to YouTube; tag Vimeo iframes
  │  block render / oembed
  ├─ wp_footer / inline     → window._googlesitekit.contentEvents = { postID, wordCount, ... }
  └─ conditionally enqueue Vimeo Player SDK when a Vimeo iframe is present

content-events.js  (frontend)
  ├─ read_article        → IntersectionObserver(anchor) + dwell timer
  ├─ pagination_click    → delegated click on a.post-page-numbers / bbPress links
  ├─ contact_link_click  → delegated click on a[href^="tel:"], a[href^="mailto:"]
  ├─ outbound_link_click → delegated click on a[rel~="sponsored"|"ugc"|"nofollow"]
  └─ video (Vimeo)       → Vimeo Player SDK playback callbacks → video_* events
          (YouTube video_* events are fired by GA4 Enhanced Measurement itself)
```

## **Infrastructure**

We reuse the following existing infrastructure; no new external service is introduced (the only new library is the Vimeo Player SDK, discussed under [Dependencies](#dependencies)).

- **`Conversion_Tracking`** (`includes/Core/Conversion_Tracking/Conversion_Tracking.php`) — instantiated and registered in `Plugin.php`. Its `maybe_enqueue_scripts()` already enforces our two hard preconditions (Conversion Tracking enabled + a GA4/Ads web tag present via `did_action( 'googlesitekit_analytics-4_init_tag' )` / `googlesitekit_ads_init_tag`) and injects the `gtagEvent` helper. We add our provider to `self::$providers`; everything else is inherited.
- **`Conversion_Events_Provider`** base class — provides `is_active()`, `get_category()`, `get_event_names()`, `register_hooks()`, `register_script()`, `get_debug_data()`. Our provider overrides these.
- **`window._googlesitekit.gtagEvent( name, data )`** — the throttled, `event_source`‑stamping wrapper around `gtag( 'event', … )`. All five events call it; we send **nothing** to `gtag` directly.
- **`Script`** asset class + **`frontendModules.config.js`** webpack config — where the existing `googlesitekit-events-provider-*` frontend entries are declared and built to `dist/assets/js/`. We add one entry.
- **`Conversion_Tracking_Settings`** (`googlesitekit_conversion_tracking` → `{ enabled: bool }`) — the single on/off gate the user already controls. No new setting is required for these events to fire.
- **`googlesitekit_inline_base_data` filter** — the existing channel for surfacing PHP flags to JS (already used for `hasActiveLeadEventProviders` etc.). Available if any admin‑surface flag is later needed.
- **`Core\Util\Feature_Flags`** + **`feature-flags.json`** — for the new feature flag.

## **Detailed design**

### **Feature flag**

The feature is built behind a new `contentEvents` feature flag (added to `feature-flags.json` and checked via `Feature_Flags::enabled( 'contentEvents' )`). The provider's `is_active()` returns `true` only when the flag is enabled, so with the flag off nothing changes for existing sites.

### **New provider: `Content_Events`**

A new class `Content_Events` in `includes/Core/Conversion_Tracking/Conversion_Event_Providers/`, extending `Conversion_Events_Provider`, registered in `Conversion_Tracking::$providers` under a new slug `content-events`.

| Method | Behavior |
| :---- | :---- |
| `is_active()` | `Feature_Flags::enabled( 'contentEvents' )` — **not** plugin‑gated. All finer gating is per‑event, client‑ or hook‑side. |
| `get_category()` | New constant `CATEGORY_CONTENT = 'content'` (added to the base class). |
| `get_event_names()` | Returns `array()` — see [Keeping content events separate](#keeping-content-events-separate). |
| `register_script()` | Registers/returns a `Script` for `googlesitekit-events-provider-content-events` (`execution => 'defer'`), mirroring the existing providers. |
| `register_hooks()` | Adds the `the_content` anchor filter, the oEmbed/block YouTube+Vimeo filters, the per‑page inline‑config output, and the conditional Vimeo SDK enqueue. |

### **Keeping content events separate** {#keeping-content-events-separate}

The existing `get_supported_conversion_events()` merges every active provider's `get_event_names()`, and that list is consumed by:

- `Ads.php` → `supportedConversionEvents` inline data (Ads conversion labels), and
- ACR's `Conversion_Reporting_Provider` (via `get_active_provider_categories()`, which already intersects with `LEAD`/`ECOMMERCE` only).

Content engagement events are **not** conversion actions and must not appear in either place. The recommended, lowest‑risk way to guarantee this:

1. `Content_Events::get_event_names()` returns `array()`, so it contributes nothing to `get_supported_conversion_events()` / feature‑metric event lists. The actual GA event names live in the frontend script, which is where they're emitted anyway.
2. `CATEGORY_CONTENT` is a new value not in the `LEAD`/`ECOMMERCE` set, so `get_active_provider_categories()` (which already intersects against those two) excludes it automatically — **no change** to that method or to ACR.

This means the shared enumerations require **no modification**, and there is zero risk of content events leaking into Ads/ACR. (An alternative — returning the real event names and category‑scoping every consumer — is discussed under [Alternatives considered](#alternatives-considered).)

### **PHP hooks (`register_hooks`)**

- **End‑of‑content anchor (read_article):** on `is_singular( 'post' )`, a `the_content` filter appends an invisible marker (e.g. `<span id="googlesitekit-end-of-content" aria-hidden="true"></span>`) so the frontend can observe it precisely. The frontend falls back to a scroll‑depth threshold when the anchor is absent (page builders/patterns that bypass `the_content`).
- **Per‑page config:** an inline script (attached `'before'` the provider handle, exactly like WooCommerce's `window._googlesitekit.wcdata`) publishes `window._googlesitekit.contentEvents = { postID, wordCount, readingSpeedWPM, readThresholdPct, readMinSeconds, isSinglePost, bbpressActive }`. Word count is computed server‑side from the post content; the reading‑time tunables come from a single PHP constants block mirroring the JS one.
- **YouTube `enablejsapi=1`:** filters on `embed_oembed_html` / `oembed_result` (and the core embed block render for block themes) rewrite YouTube iframe `src` to add `enablejsapi=1`, which unlocks GA4 Enhanced Measurement's native `video_*` events. We only enable them — GA4 sends them.
- **Vimeo detection + SDK enqueue:** the same filter path tags Vimeo iframes (and enables their JS API), and when at least one Vimeo iframe is present the provider enqueues the Vimeo Player SDK (`@vimeo/player`) so the frontend can attach playback callbacks.

### **Frontend script (`content-events.js`)**

A single new entry in `frontendModules.config.js` (`googlesitekit-events-provider-content-events` → `./js/event-providers/content-events.js`). It reads `window._googlesitekit.contentEvents` and wires each handler independently; each handler is a no‑op if its precondition isn't met. All emissions go through `global._googlesitekit?.gtagEvent?.( name, data )`.

- **`read_article`** — only when `isSinglePost`. Combines an `IntersectionObserver` on the end anchor (or a ~90% scroll‑depth fallback) **and** a dwell timer that must reach `readThresholdPct` of the estimated read time; the timer pauses on tab blur/idle. Constants (`238` WPM, `85%`, `5s` floor) live in one exported block so they can be tuned. Params: `post_id`, `word_count` (or `estimated_read_time_sec`).
- **`pagination_click`** — delegated `document` click listener scoped to `a.post-page-numbers` inside post content (primary) and, when `bbpressActive`, `.bbp-pagination-links a.page-numbers` (secondary, scoped to avoid the generic `.page-numbers` class colliding with archive pagination). Sent with `transport_type: 'beacon'` because the click triggers a full reload. Params: `pagination_type`, `page_number`, `post_id`.
- **`contact_link_click`** — delegated `document` click on `a[href^="tel:"], a[href^="mailto:"]`, `link_type: 'phone' | 'email'`. **No raw number/address is sent** (PII); at most the email domain.
- **`outbound_link_click`** — delegated `document` click on `a[rel~="sponsored"], a[rel~="ugc"], a[rel~="nofollow"]` (token‑match, not string‑equal). Params: `link_rel` (space‑joined matches), `link_url`, `link_domain`.
- **Vimeo video** — using the Vimeo Player SDK, attaches to discovered players and fires `video_start` / `video_progress` (10/25/50/75%) / `video_complete` with `video_provider: 'vimeo'`, mirroring GA4's YouTube params so both providers report together.

### **Per‑event summary**

Reproduced from the FE tracking spec for convenience — see [`frontend-event-tracking.md`](./frontend-event-tracking.md) §2 for the authoritative triggers, params, and limitations.

| # | Event → GA | Trigger | Emitted by |
| :---- | :---- | :---- | :---- |
| 1 | `read_article` | Single post: reaches end anchor / ≥90% scroll **and** dwell ≥85% of est. read time (238 WPM, 5s floor) | Site Kit |
| 2 | `video_start` / `video_progress` / `video_complete` (YouTube) | Native GA4 video engagement, unlocked by our `enablejsapi=1` filter | GA4 Enhanced Measurement |
| 2b | `video_start` / `video_progress` / `video_complete` (`video_provider:'vimeo'`) | Vimeo Player SDK playback callbacks | Site Kit |
| 3 | `pagination_click` | Click on `a.post-page-numbers` (and bbPress thread pagination) | Site Kit |
| 4 | `contact_link_click` (`link_type`) | Click on `tel:` / `mailto:` links | Site Kit |
| 5 | `outbound_link_click` (`link_rel`) | Click on `rel~=sponsored\|ugc\|nofollow` links | Site Kit |

# **Common considerations**

### **Dashboard sharing**

Not applicable. These events are emitted on the **public site frontend** through the visitor's GA4/Ads tag; they do not read Google API data and surface nothing in the Site Kit dashboard. Dashboard Sharing rules are unaffected.

### **Tester plugin**

We should add toggles to force the preconditions and page contexts for manual QA: force Conversion Tracking enabled + a GA4/Ads tag present, force `is_singular('post')` contexts with a known word count (to exercise the read‑time math without waiting), inject sample YouTube/Vimeo embeds, `<!--nextpage-->` split posts, `tel:`/`mailto:` links, and `rel`‑qualified outbound links. This lets QA verify each event fires with the right params in GA4 DebugView.

### **Site Health**

`Content_Events::get_debug_data()` should report which content events are enabled/eligible on this install (e.g. `read_article, pagination_click, contact_link_click, outbound_link_click, video (vimeo)`), plus whether bbPress is detected, to help support triage "why isn't event X firing" reports.

### **Feature discovery**

None. This is silent, backend/frontend tracking with no dashboard UI, so no feature tour or banner is introduced. Discoverability is via the existing Conversion Tracking setting the events already depend on.

### **Internal measurement: feature metrics**

Extend the existing `Conversion_Tracking::get_feature_metrics()` with a `content_events` metric listing the content events currently eligible on the site (computed from the provider's enabled handlers). This keeps content tracking observable without adding it to the lead/e‑commerce `conversion_tracking_events*` metrics.

# **Alternatives considered** {#alternatives-considered}

### **One provider vs. one provider per event vs. a mechanism outside the provider framework**

- **One `Content_Events` provider (recommended):** one script, one set of hooks, maximal reuse of the enqueue precondition + `gtagEvent` pipeline. Per‑event gating is cheap and lives where the event does.
- **One provider per event:** cleaner separation but multiplies scripts and boilerplate for events that share the same precondition and pipeline; rejected as over‑engineering.
- **A parallel mechanism outside `Conversion_Events_Provider`:** would duplicate the active‑provider walk, the enqueue preconditions, and the `gtagEvent` injection. Rejected — the provider base already models exactly "register hooks + register a frontend script gated by the pipeline."

### **`get_event_names()` returns `[]` vs. returning real names + category‑scoping consumers**

Returning `array()` (recommended) needs **no** change to the shared enumerations and cannot leak into Ads/ACR. The alternative — returning the five names and adding category filters to `get_supported_conversion_events()`/`Ads.php`/feature metrics — is more "semantically honest" but touches shared, Ads‑facing code for no functional gain, so it's rejected for this epic.

### **End‑of‑content anchor vs. pure scroll depth**

The anchor (via `the_content`) is precise but bypassed by some page builders/block patterns; pure scroll depth always works but is coarser. We do **both**: anchor when present, scroll‑depth fallback otherwise.

### **Vimeo: custom SDK build vs. skip**

Enhanced Measurement cannot track Vimeo by any filter/parameter, so we build it with the official Player SDK (in scope). Other providers (Wistia, self‑hosted `<video>`) are out of scope for now.

### **Single `contact_link_click` (with `link_type`) vs. separate `phone_call_click`/`email_click`**

Single event + param keeps one filterable GA4 report and mirrors how GA4 carries detail in params — consistent with the `outbound_link_click` decision.

# **Future Work** {#future-work}

- Additional video providers (Wistia, self‑hosted HTML5 `<video>`).
- Broader pagination coverage (archive `paginate_links()`, `<!--more-->`, "load more"/infinite scroll, next/previous post links).
- Surfacing content‑engagement events in a dashboard widget (this epic only emits to GA; it does not report back).

# **Dependencies**

- **Vimeo Player SDK (`@vimeo/player` / `player.js`)** — the only new dependency, loaded only on pages that contain a Vimeo iframe. If it fails to load, Vimeo events are simply not sent; nothing else is affected.
- **GA4/Ads web tag + Conversion Tracking enabled** — existing hard preconditions, already enforced by `maybe_enqueue_scripts()`.

# **Migrations**

None. No new persisted settings or database entries are introduced (the feature reuses the existing `googlesitekit_conversion_tracking` toggle).

# **Technical debt**

Minimal. The design intentionally avoids modifying shared enumerations by having the provider report no conversion‑event names. The one small addition to the base class is the `CATEGORY_CONTENT` constant. The reading‑time heuristic (238 WPM / 85% / 5s) is centralized in one constants block (PHP + JS) so it can be tuned without hunting through the code.

# **Quality attributes**

## **Security**

We inject small frontend scripts and rewrite oEmbed iframe markup on public pages. All output must be properly escaped, iframe `src` rewriting must validate host/URL before modifying, and delegated listeners must not trust attacker‑controlled DOM. No credentials or tokens are involved.

## **Reliability**

All events are **client‑side only** and therefore best‑effort: they are dropped by ad/tracker blockers, no‑JS clients, and GA Consent Mode denials, and `pagination_click` can still be lost on very fast navigations despite `sendBeacon`. This is inherent to frontend tracking and is documented as a coverage limitation, not a regression. Failures are isolated per handler — one throwing does not stop the others.

## **Privacy**

No new PII is collected. `contact_link_click` deliberately **omits** the raw phone number/email (at most an email domain). Outbound/video params carry only URLs/domains and titles that are already public on the page. This follows the same PII‑avoidance posture as the existing providers' `user_data` handling.

## **Scalability**

Negligible runtime cost: delegated `document` listeners (constant number regardless of link count), one `IntersectionObserver`, and a paused‑on‑blur timer. The Vimeo SDK loads only when a Vimeo iframe exists. Server‑side work is a word count and a few string filters per request.

## **Accessibility (a11y)**

No user‑facing UI is added. The only DOM addition is a visually hidden, `aria-hidden` end‑of‑content anchor with no interactive semantics, so there is no keyboard/screen‑reader impact.

## **Internationalization (i18n)**

No user‑facing strings are added on the frontend. The reading‑time heuristic (238 WPM) is calibrated for English/Latin scripts and is a documented limitation for other languages; any admin‑facing debug strings use the standard `__()` translation functions with the `google-site-kit` text domain.

# **Project management**

## **Work estimates**

Proposed GitHub issues for this mini‑epic (issue numbers and final points TBD at grooming).

| # | Title | Design Doc Points |
| :---- | :---- | :---- |
| 1 | `contentEvents` feature flag | 3 |
| 2 | `Content_Events` provider scaffold + registration + `content-events.js` entry (pipeline wiring) | 8 |
| 3 | `read_article` — end‑of‑content anchor, reading‑time constants, IntersectionObserver + dwell timer | 13 |
| 4 | Embedded video — YouTube `enablejsapi=1` filter + Vimeo Player SDK tracking | 13 |
| 5 | `pagination_click` — post pagination + bbPress thread pagination | 8 |
| 6 | `contact_link_click` — `tel:` / `mailto:` delegated tracking | 5 |
| 7 | `outbound_link_click` — `rel`‑qualified delegated tracking | 5 |
| 8 | Site Health debug data + `content_events` feature metric + tester‑plugin support | 5 |
