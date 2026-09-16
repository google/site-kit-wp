# Benchmarking response assembly — the GA4 reports, the daily series and the ranked dimension rows

## Feature Description

`GET:benchmarking-data` returns everything the Typical Traffic tab draws, but nothing yet produces it. This issue is the gathering and the arithmetic behind that response: the Google Analytics reports it runs, the thirteen-month daily series it builds from them, the site's totals for the selected period and the one before it, the ranked rows for each dimension, and the order the dimensions are given in.

**The reports.** Seven reports answer the response, and Analytics runs up to five report requests per call, so they cost two calls rather than seven. One report is the daily series: visitors by day, ascending, over the 395 days ending on the selected `endDate`. The other six are dimension reports — channel, device, new against returning, referring source, page path and post category — and each one carries both its windows as two date ranges in a single request rather than as two requests. The last two of the six read custom dimensions Site Kit collects itself, and they are requested only where those dimensions have data, so a site that collects neither issues five reports in one call instead of seven in two.

**The daily series and the totals.** Analytics returns no row for a day with no traffic, so the series is keyed by date and the gaps are filled with zeros before anything is computed from it. A missing day must not shorten the window or shift every later day's position, which in a format whose date axis is one start date plus one count per day it otherwise would. Both visitor totals are summed out of that same series rather than fetched from a separate report: the selected period and the one before it are at most 180 days together, well inside the 395 the series already covers, and summing guarantees that the headline the tab compares against cannot disagree with the chart above it.

**The ranking.** The tab shows the factors that moved traffic, most explanatory first, and that order is derived here rather than in the browser. One formula scores every row in every dimension, so a search query, a channel and a device are ranked on the same scale. The score combines how much of the site's own movement a row accounts for with how far that row departed from what the site's overall growth alone would have predicted for it, then weights it by dimension — a specific driver such as a page or a referrer outweighs a broad one such as device category, because device and visitor mix usually only mirror a channel shift that is already counted elsewhere.

Three filters drop rows before ranking. A significance floor removes rows too small to be anything but noise. A counter-trend filter removes small movements in the opposite direction to the site's own, which an ordering built to explain the site's trend should not lead with. And a macro-divergence filter, on device and visitor-mix rows only, removes values that merely track the site's overall change and so explain nothing beyond it.

Surviving rows are ranked within their dimension and capped, and the dimensions themselves are ordered by the sum of their surviving rows' scores. A dimension whose rows were all dropped carries no entry at all. The rows the response carries are exactly the rows the tab renders, so the cap bounds both what a reader sees and what browser storage holds.

The arithmetic has to be deterministic — stable ordering, stable rounding, stable caps — because that is what makes it testable against fixed report fixtures, and because two runs over unchanged figures that come out differently are two cache entries in the reader's browser.

This issue produces the assembled response. Encoding it is #13593, dispatching the request is #13594, and the search-query rows come from #13596.

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* For a request with `startDate=2026-08-19` and `endDate=2026-09-15`, the assembled response carries `visitors`, `dailyTraffic`, `dimensions` and `contextualData`, and the comparison period is the 28 days immediately before `startDate` — `2026-07-22` to `2026-08-18`.
* `dailyTraffic` holds one row per day for the 395 days ending on `endDate`, in ascending date order, with no day missing. A day Analytics returned no row for carries `visitors: 0`, and the days after it keep their own dates.
* `visitors.current` is the sum of `dailyTraffic` over the selected period and `visitors.previous` is the sum over the comparison period, so the totals and the chart cannot disagree.
* Six Analytics reports are run for the response, in at most two calls:

  | Rows by | Windows | Feeds |
  | :---- | :---- | :---- |
  | `date`, ascending | the 395 days ending on `endDate` | `dailyTraffic` and both `visitors` totals |
  | `sessionDefaultChannelGrouping` | selected and comparison | `CHANNELS` |
  | `deviceCategory` | selected and comparison | `DEVICES` |
  | `newVsReturning` | selected and comparison | `VISITOR_MIX` |
  | `sessionSource` | selected and comparison | `REFERRERS` |
  | `pagePath`, filtered on `customEvent:googlesitekit_post_date` | selected and comparison | `CONTENT` |
  | `customEvent:googlesitekit_post_categories` | selected and comparison | `CATEGORIES` |

* The `pagePath` report is run only where `googlesitekit_post_date` has data, and the `customEvent:googlesitekit_post_categories` report only where `googlesitekit_post_categories` has data. On a site where neither has data, five reports are run in one call, and `contextualData` carries no `content` and no `categories` key.
* A dimension value's two windows are paired by the value itself, so a channel named `Organic Search` in the selected period is matched to `Organic Search` in the comparison period whatever position either row was returned in. A value present in one window and absent from the other is paired with a count of `0` for the window it is missing from.
* Every row in every dimension is scored on the same scale, from its own `current` and `previous` counts and the site-wide `visitors.current` and `visitors.previous`:

  | Term | Value |
  | :---- | :---- |
  | `delta` | `current - previous` |
  | `trafficImpactPct` | `delta / MAX( visitors.previous, visitors.current ) * 100` |
  | `selfChangePct` | `delta / previous * 100`, or `100` when `previous` is `0` and `current` is above `0` |
  | `siteGrowthRate` | `( visitors.current - visitors.previous ) / visitors.previous` |
  | `excessImpactPct` | `( delta - previous * siteGrowthRate ) / MAX( visitors.previous, visitors.current ) * 100` |
  | `score` | `( 0.6 * ABS( trafficImpactPct ) + 0.4 * ABS( excessImpactPct ) ) * weight * boost` |

* `weight` is fixed per dimension: `CONTENT` `1.5`, `SEARCH_QUERIES` `1.4`, `REFERRERS` `1.3`, `CATEGORIES` `1.2`, `CHANNELS` `1.1`, `DEVICES` `1.0`, `VISITOR_MIX` `1.0`.
* `boost` is `1.25` when a row moved in the same direction as the site and `1.0` otherwise. The site's direction is `UP` when `visitors` rose by at least `3%` from the comparison period, `DOWN` when it fell by `3%` or more, and `STABLE` between them; a row's direction is the sign of its own `delta`.
* A row is dropped from the response — not ranked, not capped, and not counted toward its dimension's total — when any of these hold:
  * `ABS( delta ) < 5`, or `ABS( trafficImpactPct ) < 0.40`.
  * The row's direction opposes the site's direction and the row clears neither `ABS( trafficImpactPct ) >= 1.0` nor both of `ABS( selfChangePct ) >= 10` and `ABS( delta ) >= 25`.
  * The row is a `DEVICES` or `VISITOR_MIX` row and `ABS( selfChangePct - totalPctChange ) < 5`, where `totalPctChange` is the site's own percentage change between the two periods.
* Each dimension carries at most **5** rows, the highest-scoring first. A dimension whose seventh-highest row scores above its sixth is still cut to five.
* `dimensions` lists the dimension codes ordered by the sum of each dimension's surviving row scores, highest first, and names only dimensions that have a `contextualData` key with at least one surviving row. A dimension every one of whose rows was dropped appears in neither `dimensions` nor `contextualData`.
* Two dimensions whose surviving rows sum to the same score, and two rows within a dimension that score the same, come back in the same order on every run over the same report figures.
* Running the assembly twice over the same fixed report figures produces the same response, including the order of every row, the order of `dimensions` and every rounded number.
* A dimension contributed through the contextual-data filter is scored, filtered, ranked and capped by the same rules and the same cap of **5** as a dimension derived from an Analytics report.
* Every non-integer in the response is rounded before it leaves the server.

## Implementation Brief

* [ ] <!-- One or more bullet points for how to technically implement the feature. Make sure to include changes to Storybook and visual regression tests where relevant. -->

### Test Coverage

* <!-- One or more bullet points for how to implement automated tests to verify the feature works. -->

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
