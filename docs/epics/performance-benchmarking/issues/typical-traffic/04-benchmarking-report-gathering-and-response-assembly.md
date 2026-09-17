# Benchmarking response assembly — the GA4 reports, the daily series and the ranked dimension rows

## Feature Description

`GET:benchmarking-data` returns everything the Typical Traffic tab draws, but nothing yet produces it. This issue is the gathering and the arithmetic behind that response: the Google Analytics reports it runs, the thirteen-month daily series it builds from them, the site's totals for the selected period and the one before it, the ranked rows for each dimension, and the order the dimensions are given in.

**The reports.** Seven reports answer the response, and Analytics runs up to five report requests per call, so they cost two calls rather than seven. One report is the daily series: visitors by day, ascending, over the 395 days ending on the selected `endDate`. The other six are dimension reports — channel, device, new against returning, referring source, page path and post category — and each one carries both its windows as two date ranges in a single request rather than as two requests. The last two of the six read custom dimensions Site Kit collects itself, and they are requested only where those dimensions have data, so a site that collects neither issues five reports in one call instead of seven in two.

**The daily series and the totals.** Analytics returns no row for a day with no traffic, so the series is keyed by date and the gaps are filled with zeros before anything is computed from it. A missing day must not shorten the window or shift every later day's position, which in a format whose date axis is one start date plus one count per day it otherwise would. Both visitor totals are summed out of that same series rather than fetched from a separate report: the selected period and the one before it are at most 180 days together, well inside the 395 the series already covers, and summing guarantees that the headline the tab compares against cannot disagree with the chart above it.

**The ranking.** The tab shows the factors that moved traffic, most explanatory first, and that order is derived here rather than in the browser. One formula scores every row in every dimension, so a search query, a channel and a device are ranked on the same scale. The score combines how much of the site's own movement a row accounts for with how far that row departed from what the site's overall growth alone would have predicted for it, then weights it by dimension — a specific driver such as a page or a referrer outweighs a broad one such as device category, because device and visitor mix usually only mirror a channel shift that is already counted elsewhere.

Three filters drop rows before ranking. A significance floor removes rows too small to be anything but noise. A counter-trend filter removes small movements in the opposite direction to the site's own, which an ordering built to explain the site's trend should not lead with. And a macro-divergence filter, on device and visitor-mix rows only, removes values that merely track the site's overall change and so explain nothing beyond it.

Surviving rows are ranked within their dimension and capped, and the dimensions themselves are ordered by the sum of their surviving rows' scores. A dimension whose rows were all dropped carries no entry at all. The rows the response carries are exactly the rows the tab renders, so the cap bounds both what a reader sees and what browser storage holds.

Concretely, this is what the reports look like on the way in and the response on the way out. The daily series arrives with its dates in GA4's `YYYYMMDD` form and with no row at all for a day that had no visitors:

```json
"rows": [
	{ "dimensionValues": [ { "value": "20250817" } ], "metricValues": [ { "value": "121" } ] },
	{ "dimensionValues": [ { "value": "20250819" } ], "metricValues": [ { "value": "147" } ] }
]
```

For a request ending on `2026-09-15` the 395-day window opens on `2025-08-17`, and the first three of its days, with the site's two totals, come out as:

```json
{
	"visitors": { "current": 412, "previous": 388 },
	"dailyTraffic": [
		{ "date": "2025-08-17", "visitors": 121 },
		{ "date": "2025-08-18", "visitors": 0 },
		{ "date": "2025-08-19", "visitors": 147 }
	]
}
```

`2025-08-18` is written back in with a count of `0` rather than left out, because the encoded response replaces the date column with one start date and one count per day: a day dropped there does not leave a gap, it pulls every later day back by one and shortens the window by one. Both figures in `visitors` are sums over that filled series — `current` over `2026-08-19` to `2026-09-15`, `previous` over `2026-07-22` to `2026-08-18`.

A dimension report arrives with both of its windows in one payload, one row per value per window, the window named by a trailing `dateRange` dimension value and the counts wrapped as strings:

```json
{
	"dimensionHeaders": [ { "name": "sessionDefaultChannelGrouping" }, { "name": "dateRange" } ],
	"metricHeaders": [ { "name": "totalUsers", "type": "TYPE_INTEGER" } ],
	"rows": [
		{ "dimensionValues": [ { "value": "Organic Search" }, { "value": "date_range_0" } ], "metricValues": [ { "value": "210" } ] },
		{ "dimensionValues": [ { "value": "Direct" }, { "value": "date_range_0" } ], "metricValues": [ { "value": "118" } ] },
		{ "dimensionValues": [ { "value": "Referral" }, { "value": "date_range_0" } ], "metricValues": [ { "value": "47" } ] },
		{ "dimensionValues": [ { "value": "Email" }, { "value": "date_range_0" } ], "metricValues": [ { "value": "42" } ] },
		{ "dimensionValues": [ { "value": "Direct" }, { "value": "date_range_1" } ], "metricValues": [ { "value": "137" } ] },
		{ "dimensionValues": [ { "value": "Organic Search" }, { "value": "date_range_1" } ], "metricValues": [ { "value": "168" } ] },
		{ "dimensionValues": [ { "value": "Email" }, { "value": "date_range_1" } ], "metricValues": [ { "value": "40" } ] }
	]
}
```

and against those two totals it becomes three rows:

```json
"channels": [
	{ "label": "Referral", "current": 47, "previous": 0 },
	{ "label": "Organic Search", "current": 210, "previous": 168 },
	{ "label": "Direct", "current": 118, "previous": 137 }
]
```

`Organic Search` leads `date_range_0` and follows `Direct` in `date_range_1`, so pairing the windows by anything but the value itself would set its `210` against `Direct`'s `137`. `Referral` has no `date_range_1` row, which is a channel that appeared out of nothing rather than a channel whose figure is missing, so it pairs with `0`. `Email` moved `42` against `40` and the significance floor drops it, which takes it out of `contextualData` and out of the sum that ranks `CHANNELS` against the other six dimensions. The three that survive come back ordered by score rather than by size: `Referral` accounts for more of the site's own movement than `Organic Search` despite the smaller count, and `Direct` ranks last because it fell while the site rose and so earns no same-direction boost.

The arithmetic has to be deterministic — stable ordering, stable rounding, stable caps — because that is what makes it testable against fixed report fixtures, and because two runs over unchanged figures that come out differently are two cache entries in the reader's browser.

This issue produces the assembled response. Encoding it is #13593, dispatching the request is #13594, and the search-query rows come from #13596.

Link to the design doc: https://docs.google.com/document/d/1dsEs6-NjlP_LNqz5md5fnJMuxh9Vd9f88w4DTrZdLok/edit?tab=t.y7e2u5h52vf1

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

* [ ] In `includes/Modules/Analytics_4/Benchmarking/Report_Options.php` (new file):
  * Add `Report_Options`, holding every window and dimension in one place, following `Analytics_4\Email_Reporting\Report_Options`. Its constructor takes `$start_date` and `$end_date`.
  * Add the constants: `DAILY_SERIES_DAYS`, set to `395`; `REPORT_ROW_LIMIT`, set to `50`, the rows each dimension report asks GA4 for before any row is dropped.
  * Add `get_compare_range()`, returning the window of the same length immediately before `$start_date`. For `2026-08-19` to `2026-09-15` it returns `2026-07-22` to `2026-08-18`.
  * Add `get_daily_series_options()`, returning the report options for `totalUsers` by `date`, ordered by `date` ascending, over the `DAILY_SERIES_DAYS` days ending on `$end_date`, with one date range.
  * Add one method per dimension report, each returning `totalUsers` with `startDate`/`endDate` and `compareStartDate`/`compareEndDate` set, `limit` set to `REPORT_ROW_LIMIT`, and the dimensions below:

    | Method | Dimensions | Feeds |
    | :---- | :---- | :---- |
    | `get_channels_options()` | `sessionDefaultChannelGrouping` | `CHANNELS` |
    | `get_devices_options()` | `deviceCategory` | `DEVICES` |
    | `get_visitor_mix_options()` | `newVsReturning` | `VISITOR_MIX` |
    | `get_referrers_options()` | `sessionSource` | `REFERRERS` |
    | `get_content_options()` | `pagePath`, `pageTitle`, `customEvent:googlesitekit_post_date` | `CONTENT` |
    | `get_categories_options()` | `customEvent:googlesitekit_post_categories` | `CATEGORIES` |

* [ ] In `includes/Modules/Analytics_4/Benchmarking/Row_Scorer.php` (new file):
  * Add `Row_Scorer`, a class with no dependency on the REST layer, the module or the reports, so PHPUnit can drive it from plain arrays.
  * Add `DIMENSION_WEIGHTS`, mapping each dimension code to its weight: `CONTENT` `1.5`, `SEARCH_QUERIES` `1.4`, `REFERRERS` `1.3`, `CATEGORIES` `1.2`, `CHANNELS` `1.1`, `DEVICES` `1.0`, `VISITOR_MIX` `1.0`. Add `SAME_DIRECTION_BOOST`, set to `1.25`, and `SITE_DIRECTION_THRESHOLD_PERCENT`, set to `3`.
  * Add the drop thresholds as constants: `MINIMUM_ABSOLUTE_DELTA` `5`, `MINIMUM_TRAFFIC_IMPACT_PERCENT` `0.40`, `COUNTER_TREND_TRAFFIC_IMPACT_PERCENT` `1.0`, `COUNTER_TREND_SELF_CHANGE_PERCENT` `10`, `COUNTER_TREND_DELTA` `25`, and `MACRO_DIVERGENCE_PERCENT` `5`.
  * Add `score_row( $dimension_code, array $row, $visitors_current, $visitors_previous )`, computing the terms named in the acceptance criteria and returning the score. Guard every division: when the denominator is `0` the term is `0`, except `selfChangePct`, which is `100` when `previous` is `0` and `current` is above `0`, and `0` when both are `0`.
  * Add `get_site_direction( $visitors_current, $visitors_previous )`, returning `UP`, `DOWN` or `STABLE`. The boost applies only when the site's direction is `UP` or `DOWN` and the sign of the row's `delta` agrees with it; a `STABLE` site gives every row a boost of `1.0`.
  * Add `should_drop_row( $dimension_code, array $row, ... )`, applying the three filters in the acceptance criteria: the significance floor, the counter-trend filter, and the macro-divergence filter on `DEVICES` and `VISITOR_MIX` rows only.

* [ ] In `includes/Modules/Analytics_4/Benchmarking/Response_Builder.php`:
  * Fill in `build( $start_date, $end_date )`, which #13594 added as an empty method, with the four steps below. Return any `WP_Error` a report call gives back, unchanged and immediately.
  * Gather: collect the report options into one array keyed by dimension code, with the daily series first, then run them through `$this->module->get_data( 'batch-report', array( 'requests' => $chunk ) )` in chunks of five with `array_chunk( $requests, 5, true )`, following `Email_Reporting_Data_Requests::collect_batch_reports()`.
  * Request `get_content_options()` only when `Custom_Dimensions_Data_Available::get_data_availability()` reports `googlesitekit_post_date` as available, and `get_categories_options()` only when it reports `googlesitekit_post_categories` as available. Pass the availability map into the builder from `Analytics_4`, the way `Email_Reporting_Data_Requests::collect_analytics_payloads()` passes it to its report options. With neither available the array holds five requests, so one call is made.
  * Derive `dailyTraffic`: key the daily-series rows by their `date` dimension value, then walk the `DAILY_SERIES_DAYS` days from the window's first day to `$end_date` in order, emitting `{ date, visitors }` for each, with `visitors` set to `0` for a day the report returned no row for.
  * Derive `visitors`: sum `dailyTraffic` over `$start_date` to `$end_date` for `current`, and over the compare range for `previous`. Do not run a separate totals report.
  * Pair each dimension report's two windows by the dimension's own value rather than by row position, reading `date_range_0` as the selected period and `date_range_1` as the comparison period, following `Analytics_4\Email_Reporting\Report_Data_Processor::aggregate_dimension_metrics()`. A value present in one window only is paired with `0` for the window it is missing from.
  * Build each dimension's rows in the shape its `contextualData` key declares. A `CONTENT` row takes its `url` from `pagePath`, its `title` from `pageTitle`, its `visitors` from the selected period, and its `publishedDaysAgo` from the whole days between the `customEvent:googlesitekit_post_date` value — which GA4 returns as `YYYYMMDD` — and `$end_date`.
  * Score, filter, rank and cap in one pass over the whole contextual-data map, so that rows another source adds later go through the same path. The filter that lets another module add rows is #13596.
  * Add `MAX_ROWS_PER_DIMENSION`, set to `5`. Drop the rows `Row_Scorer::should_drop_row()` rejects, sort what is left by score descending, then cut each dimension to `MAX_ROWS_PER_DIMENSION`. A dimension left with no rows carries no `contextualData` key.
  * Order `dimensions` by the sum of each dimension's surviving row scores, descending, naming only dimensions that have a `contextualData` key with at least one row.
  * Break every tie explicitly rather than relying on the sort being stable, because `usort()` is not stable on PHP 7.4: two rows of one dimension with the same score are ordered by their label with `strcmp()` ascending — by `url` for a `CONTENT` row — and two dimensions whose rows sum to the same score are ordered by their position in `Wire_Format::DIMENSION_INDEXES` ascending.
  * The score is an internal value and does not appear in the response. Round every non-integer the response carries before returning it.

Encoding the response is #13593, and the datapoint that dispatches the request is #13594.

### Test Coverage

* Add `tests/phpunit/integration/Modules/Analytics_4/Benchmarking/Report_OptionsTest.php` covering:
  * `get_compare_range()` returns `2026-07-22` to `2026-08-18` for a selected range of `2026-08-19` to `2026-09-15`, and the window before a 90-day range is 90 days long.
  * `get_daily_series_options()` spans 395 days ending on the selected `endDate`, whatever the selected range's length.
  * Each dimension method carries both windows in one request and asks for `REPORT_ROW_LIMIT` rows.
* Add `tests/phpunit/integration/Modules/Analytics_4/Benchmarking/Row_ScorerTest.php` covering:
  * The score for a row with known counts against known site totals, including a row whose `previous` is `0`.
  * The boost applies to a row moving with the site and not to one moving against it, and a `STABLE` site boosts nothing.
  * A row is dropped by the significance floor, by the counter-trend filter, and — for `DEVICES` and `VISITOR_MIX` only — by the macro-divergence filter; the same figures on a `CHANNELS` row survive the macro-divergence check.
  * A site whose `visitors.previous` is `0` produces no division error and drops nothing unexpectedly.
* Add `tests/phpunit/integration/Modules/Analytics_4/Benchmarking/Response_BuilderTest.php`, driven from fixed batch-report fixtures, covering:
  * `dailyTraffic` holds 395 rows in ascending date order, a day GA4 omitted carries `visitors: 0`, and every later day keeps its own date.
  * `visitors.current` and `visitors.previous` are the sums of `dailyTraffic` over the two windows.
  * Six reports are run in two calls; with neither custom dimension available five are run in one call, and `contextualData` carries no `content` and no `categories` key.
  * A dimension value returned in a different row position in the two windows is still paired, and a value missing from one window is paired with `0`.
  * Each dimension is cut to five rows, highest score first, and a dimension whose rows were all dropped appears in neither `dimensions` nor `contextualData`.
  * Two rows with the same score, and two dimensions whose rows sum to the same score, come back in the same order on two runs over the same figures.
  * The whole assembly run twice over the same fixtures gives an identical response.
  * A `WP_Error` from a batch call is returned unchanged, with nothing assembled beside it.
* No Storybook story is required, because the change adds no UI.
* No VRT changes expected.

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
