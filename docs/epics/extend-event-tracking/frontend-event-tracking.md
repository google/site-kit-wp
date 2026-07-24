# Content as a Business — Frontend Event Tracking Plan

**Status:** Agreed — open questions resolved
**Scope:** What Site Kit will track from the frontend for the new generic ("not
provider‑specific") content events, the event names sent to Google Analytics, and the known
coverage limitations.

> This document answers the request: *"exactly what we will track from the FE (specific
> triggers, event names that will be sent to GA, known coverage limitations)."*
> All open questions are resolved — event names, the Vimeo approach, and the reading‑time
> constants are locked (see the notes on each event).

---

## 1. How these events plug into the existing infrastructure

All events below reuse the current Conversion Tracking pipeline in
`includes/Core/Conversion_Tracking/`:

- The PHP `Conversion_Tracking` class already injects `window._googlesitekit.gtagEvent( name, data )`,
  which calls `gtag( 'event', name, { ...data, event_source: 'site-kit' } )` with a small
  de‑dupe throttle. Every event we send is therefore automatically stamped with
  **`event_source: 'site-kit'`**.
- The existing providers (WooCommerce, Contact Form 7, …) are **gated on a plugin being active**
  (`is_active()`). The five new events are **generic** — they are not tied to any plugin, so they
  will be implemented as an always‑available content‑events handler that is gated on **page type**
  (e.g. single post) and **element presence** (e.g. a `mailto:` link exists) rather than on a
  third‑party plugin.
- **Preconditions for anything to fire (applies to all five):**
  1. Site Kit **Conversion Tracking is enabled**, and
  2. a GA4 **(or Ads) web tag is present** on the page
     (`googlesitekit_analytics-4_init_tag` / `googlesitekit_ads_init_tag`).
  If either is false, none of these events are emitted.

### At-a-glance summary

| # | What we track | Trigger (FE) | Event name → GA | Who sends it |
|---|---------------|--------------|-----------------|--------------|
| 1 | Reading entire article | Single‑post only: reader reaches the end anchor / ≥ 90% scroll depth **and** dwell ≥ 85% of estimated read time (238 WPM) | **`read_article`** | Site Kit |
| 2 | Embedded video views (YouTube) | Native GA4 video engagement, unlocked by us adding `enablejsapi=1` to the embed | `video_start`, `video_progress`, `video_complete` | **GA4 Enhanced Measurement** (we only enable it) |
| 2b | Embedded video views (Vimeo) | Vimeo Player SDK playback callbacks | `video_start`, `video_progress`, `video_complete` (with `video_provider: 'vimeo'`) | Site Kit (custom) |
| 3 | Pagination / nav link clicks | Click on within‑post pagination (`<!--nextpage-->`) and (secondary) bbPress thread pagination | **`pagination_click`** | Site Kit |
| 4 | Tel / email link clicks | Click on `<a href="tel:…">` / `<a href="mailto:…">` | **`contact_link_click`** | Site Kit |
| 5 | Qualified outbound link clicks | Click on a link marked `rel="sponsored"`, `rel="ugc"`, or `rel="nofollow"` | **`outbound_link_click`** (with `link_rel`) | Site Kit |

---

## 2. Per‑event detail

### 1) Reading entire article

- **Where:** single **post** pages only (`is_singular( 'post' )`). Home, archives, pages and other
  CPTs are intentionally excluded — this is the whole point of building our own event instead of
  relying on GA4's page‑type‑agnostic `scroll`.
- **Trigger (both conditions required):**
  1. **Position** — the reader reaches the near‑bottom of the article. Preferred implementation:
     append an invisible end‑of‑content anchor via the `the_content` filter and observe it with an
     `IntersectionObserver`; fall back to a scroll‑depth threshold (~90% of the article container)
     where no anchor is present.
  2. **Time** — a dwell timer has run for **≥ 85% of the estimated reading time**.
     Reading time = post word count ÷ reading speed, using a fixed **238 WPM** — the well‑cited
     average adult silent reading speed for English non‑fiction (Brysbaert 2019 meta‑analysis), and
     a defensible single default vs. the looser ~200 WPM plugins or Medium's ~265 WPM. Apply a small
     **minimum floor (~5 s)** so very short posts don't fire instantly. All three values (238 WPM,
     85%, 5 s floor) live in one constants block so they can be tuned later.
- **Event name → GA:** **`read_article`**. Must **not** be named `scroll` — that name
  is reserved/owned by GA4 Enhanced Measurement.
- **Suggested params:** `post_id`, `word_count` (or `estimated_read_time_sec`), plus GA4's
  `engagement_time_msec` if useful.
- **Coverage limitations:**
  - Read‑time is a **heuristic**. It is inaccurate for image/code/embed‑heavy posts, very short
    posts, and non‑Latin scripts (WPM differs by language).
  - By design, **skimmers who jump to the bottom before the time threshold are not counted**, and
    **readers who finish reading but stop above the very end** (e.g. before comments/related posts)
    are not counted.
  - The end anchor relies on `the_content`. **Page builders / block patterns that bypass
    `the_content`** won't get the anchor → we fall back to scroll‑depth, which is less precise.
  - Dwell timer must **pause on tab blur / idle**, otherwise a backgrounded tab inflates the count.
  - Coexists with GA4's native `scroll` (90%) event — this is a **stricter subset**; report builders
    must not sum the two.

### 2) Embedded video views

- **YouTube (primary, no new Site Kit event):** GA4 Enhanced Measurement already tracks YouTube
  video engagement, **but only if the embedded player exposes the JS API**. WordPress oEmbed does
  **not** add this. We will add **`enablejsapi=1`** to YouTube embeds via a filter
  (e.g. `embed_oembed_html` / `oembed_result` / block render), which lets GA4 fire its own
  **`video_start`, `video_progress` (10/25/50/75%), `video_complete`** events. We enable these; we
  don't send them, so params (`video_title`, `video_url`, `video_provider`, `video_percent`,
  `visible`) are GA4's.
  - **Limitations (YouTube):** only covers players WordPress renders as an oEmbed iframe. It will
    **miss**: raw `<iframe>`/HTML embeds a user pastes, lazy‑loaded players not present at page load,
    and privacy‑enhanced **`youtube-nocookie.com`** embeds (known to break Enhanced Measurement
    video tracking). Playlists are unreliable.
- **Vimeo (in scope, custom build):** **GA4 Enhanced Measurement does *not* support Vimeo** — no
  filter/parameter can change that. So we build it ourselves: load the **Vimeo Player SDK
  (`player.js` / `@vimeo/player`)**, discover Vimeo iframes on the page, and fire events from the
  player's playback callbacks (script enqueue + player discovery + progress math).
  - **Event names → GA:** reuse GA4's **`video_start`, `video_progress`, `video_complete`** with a
    **`video_provider: 'vimeo'`** param, so Vimeo blends into the same standard GA4 video reports as
    the YouTube events. Mirror GA4's progress thresholds (10 / 25 / 50 / 75%) so the two providers are
    directly comparable, and reuse GA4's video params where we can (`video_title`, `video_url`,
    `video_percent`). Note our Vimeo events are stamped `event_source: 'site-kit'` (GA4's native
    YouTube events are not), which is a convenient way to tell the two apart if needed.
  - Other providers (Wistia, self‑hosted HTML5 `<video>`, etc.) are **out of scope**.

### 3) Pagination / nav link clicks

- **Primary trigger — within‑article pagination:** posts split with `<!--nextpage-->` and rendered by
  `wp_link_pages()`. The reliable selector is the anchor class **`a.post-page-numbers`** (default
  container `p.post-nav-links`; the current page is a non‑link `span.post-page-numbers.current`).
  We listen for clicks on those anchors inside the post content.
- **Secondary trigger — bbPress thread pagination:** anchors inside `.bbp-pagination-links`
  (`a.page-numbers`) on forum topic pages, to measure how many users go beyond page 1. Requires
  bbPress active.
- **Event name → GA:** **`pagination_click`**. Must **not** be `click` (reserved).
- **Suggested params:** `pagination_type: 'post' | 'bbpress'`, `page_number` (destination),
  `post_id`.
- **Coverage limitations:**
  - Clicking pagination causes a **full page reload**, so the event must be sent with
    `sendBeacon`/`transport_type: 'beacon'`; very fast navigations can still drop it.
  - **Not covered:** blog/archive list pagination (`paginate_links()`), `<!--more-->` read‑more,
    "load more"/AJAX infinite scroll, next/previous **post** links, and custom plugin paginations.
  - bbPress reuses the generic `.page-numbers` class (same as `paginate_links()`), so selectors must
    be **scoped** to avoid mis‑counting non‑pagination or archive links.
  - Heavily customized themes may alter the `wp_link_pages()` markup.

### 4) Tel / email link clicks

- **Trigger:** click on any anchor whose href starts with **`tel:`** or **`mailto:`**. Bind via a
  delegated listener on `document` so links added after load are still caught.
- **Event name → GA:** **`contact_link_click`**, with `link_type: 'phone' | 'email'`.
  (Alternative: two events `phone_call_click` / `email_click` — recommend the single event + param.)
  Must **not** be `click` (reserved).
- **Suggested params:** `link_type`. **Do not send the raw phone number or email address** (PII); at
  most send the email *domain* if a dimension is needed.
- **Coverage limitations:**
  - These links are essentially **only clicked on mobile/tablet** (they open the dialer/mail app); on
    desktop they are rarely clicked, so the metric is inherently **mobile‑skewed and low‑volume**.
  - A click is **intent**, not confirmation — the user may cancel in the dialer/mail app.
  - Phone numbers / emails shown as **plain text** (not linked) are invisible to us. Obfuscated or
    JS‑generated links are caught only if present when the click bubbles to `document`.
  - GA4 Enhanced Measurement may **already count these inconsistently as outbound clicks** → possible
    double counting in outbound‑click reports.

### 5) Qualified outbound link clicks (sponsored / ugc / nofollow)

- **What & why:** Google's ["Qualify your outbound links"](https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links)
  guidance defines three `rel` qualifications for outbound links: **`sponsored`** (ads / paid
  placements), **`ugc`** (user‑generated content — comments, forum posts) and **`nofollow`** (links
  you'd rather not endorse or have Google associate with your site). GA4 Enhanced Measurement already
  tracks *generic* outbound clicks, but it **never records the `rel` qualification** — so capturing
  *which kind* of outbound link was clicked is the part that isn't already covered.
- **Trigger:** click on any link carrying one of those qualifications. `rel` can list multiple values
  (e.g. `rel="nofollow sponsored"`, `rel="ugc,nofollow"`) and may be space‑ or comma‑separated, so the
  selector must **token‑match**, not string‑equal:
  `a[rel~="sponsored"], a[rel~="ugc"], a[rel~="nofollow"]`. Bind via a delegated `document` listener so
  links added after load are still caught.
- **Event name → GA:** a single **`outbound_link_click`** event with a **`link_rel`** param recording
  the matched qualification(s) (`'sponsored'` / `'ugc'` / `'nofollow'`, space‑joined when a link
  carries more than one). One event + param keeps this to a single GA4 report filterable by
  qualification, and mirrors how GA4's own outbound `click` carries its detail in params rather than in
  the event name. Must **not** be named `click` (reserved by GA4 Enhanced Measurement).
- **Suggested params:** `link_rel`, `link_url`, `link_domain` (destination — not PII).
- **Coverage limitations:**
  - Entirely dependent on **site hygiene**: if the site owner / affiliate / forum plugin does not add
    the `rel` qualification, nothing is tracked. Many affiliate plugins **cloak** links via redirect
    paths (`/go/`, `/recommends/`) or use a bare `rel="nofollow"` — coverage is only as good as the
    markup.
  - We record **only** qualified outbound links. Plain, unqualified outbound links are **intentionally
    left to GA4 Enhanced Measurement's** outbound `click` event, so we don't duplicate it.
  - A single external click can still appear **both** here (as `outbound_link_click`) *and* in GA4's
    native outbound `click` report — report builders must not sum the two.

---

## 3. Event naming (final)

Event names are locked. `read_article`, `pagination_click`, `contact_link_click` and
`outbound_link_click` follow GA4 conventions (snake_case, ≤ 40 chars, no reserved names, no
`google_` / `ga_` / `firebase_` prefix). The video events deliberately reuse GA4's own `video_start`
/ `video_progress` / `video_complete` names (see event 2). The reading‑time tunables are fixed at
**238 WPM / 85% / 5 s floor** (see event 1).

## 4. Cross‑cutting limitations (all five events)

- **Client‑side only** — dropped by ad/tracker blockers, no‑JS clients, and **GA Consent Mode**
  denials.
- Require **Conversion Tracking enabled + a GA4/Ads tag present** (see §1).
- Subject to the same **de‑dupe throttle** as existing Site Kit events and stamped with
  `event_source: 'site-kit'`.
- Bots / prerenderers may generate noise or be filtered out inconsistently.

---

## References

- GA4 video engagement / Enhanced Measurement (YouTube, `enablejsapi`):
  [analyticsmania.com](https://www.analyticsmania.com/post/track-videos-with-google-analytics-4-and-google-tag-manager/),
  [analytify.io](https://analytify.io/ga4-video-tracking/)
- Vimeo requires custom tracking (not supported by Enhanced Measurement):
  [analyticsmania.com — Vimeo + GA4](https://www.analyticsmania.com/post/track-vimeo-player-with-google-tag-manager-and-google-analytics-4/)
- GA4 reserved / automatically‑collected event names:
  [ga4.com](https://ga4.com/automatically-collected-events-ga4),
  [optimizesmart.com](https://optimizesmart.com/blog/tracking-events-in-ga4-google-analytics-4/)
- Enhanced Measurement does not cleanly track `mailto:` / `tel:` clicks:
  [analyticsmania.com — outbound clicks](https://www.analyticsmania.com/post/where-to-find-outbound-click-data-in-google-analytics-4/)
- `wp_link_pages()` markup:
  [developer.wordpress.org](https://developer.wordpress.org/reference/functions/wp_link_pages/)
- Qualifying outbound links (`rel="sponsored"` / `"ugc"` / `"nofollow"`, combinable):
  [Google Search Central](https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links)
- Average reading speed / reading‑time conventions:
  [en.wikipedia.org — Words per minute](https://en.wikipedia.org/wiki/Words_per_minute)
