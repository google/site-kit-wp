# Review: traffic insights on the Traffic Overview panel

## Verdict

The change is correct against the **service's current contract**, and I found no
wire-level mismatch between the plugin and the service. Five of the eight decisions the
review raised are made and implemented (1, 2, 3, 4 and 6). Three need your decision
(5, 7 and 8). Where the plugin design doc differs from the code, the doc is older than
the service contract (list at the end).

The implementation and the 26 test cases the review added (16 in Jest, 10 in PHPUnit) are
commit `3a88baed4c`. The changes for the five decisions, with their tests, are
uncommitted on top of it.

> [!IMPORTANT]
> No test suite was run, neither PHPUnit nor Jest. What was run:
> - `php -l` and phpcs on the 25 PHP files of the change: clean.
> - ESLint on the 22 JS and TS files of the change: clean.
> - `tsc --noEmit` on the project: exit 0.
> - A one-off PHP script against `Period_Baseline`, to check the expected values of the
>   new band tests (see [decision 2](#2-the-charts-band-and-the-insights-verdict-come-from-one-model)).

## Decided

### 1. A failed read of the operation is a 500, unless the operation failed with code 503

- `GET:benchmarking-insight` passes a service error through only with 400, 403 or 404
  ([`PASSED_ERROR_STATUSES`](../../../includes/Modules/Analytics_4/Datapoints/Get_Benchmarking_Insight.php#L46)).
  Any other status of the read is a 500, including a 409, a 429 or a 503 from the
  operations endpoint itself. `POST:benchmarking-insight` keeps the
  [shared list](../../../includes/Modules/Analytics_4/Datapoints/Benchmarking_Insight_Datapoint.php#L50).
- So only an operation `FAILED` with code 503 is a 503, as the design doc says, and the
  [store](../../../assets/js/modules/analytics-4/datastore/benchmarking-insight.ts#L552-L607)
  asks for the insight again only for a generation that an instance shutdown interrupted.
  A 500 on a read keeps the pending operation, so the next load reads it again
  (decision 8).
- `Get_Benchmarking_InsightTest::data_service_errors` has rows for 400, 403, 404, 409,
  429 and 503.

### 2. The chart's band and the insight's verdict come from one model

- [`Period_Baseline::get_daily_ranges()`](../../../includes/Modules/Analytics_4/Benchmarking/Period_Baseline.php#L331)
  spreads the period's expected range over its days by the weekday factors: each day gets
  the range times its weekday's share of the period's weight, rounded to one decimal.
  This is the service's `dailyBand()` for the judged block
  ([§5.6](../../../../site-kit-service/docs/benchmarking_feature_design.md#L371-L397)),
  so the band under the period is the band its verdict used.
- [`Response_Builder::build()`](../../../includes/Modules/Analytics_4/Benchmarking/Response_Builder.php#L93)
  and `Insight_Request_Builder` each fit the model with
  [`Period_Baseline::from_daily_series()`](../../../includes/Modules/Analytics_4/Benchmarking/Period_Baseline.php#L259)
  on the same daily series, as the service fits it separately in
  `CalculateRobustBaselineForPeriod()` and `BuildExpectedRangeSeries()`.
- What the chart shows:
  - A period gets a band once the site has the period and two 28-day blocks of recorded
    traffic up to its last day: 84 days for a 28-day period, 146 for a 90-day period.
    Until then no day of the period has one.
  - Nothing inside the period moves the band. It changes from day to day only by the
    weekday shape, and its days add up to the range to within the rounding.
  - The forward band of §5.6, the next `min(d, 28)` days after the period, is not drawn:
    the chart ends on the period's last day.
- A site with 100 visits on every day gets 83.6 to 116.4 on each day, from a range of
  2,341 to 3,259 visits (center 2,800, margin 458.97). I worked this out by hand, and the
  one-off script gives the same. The script also checked the band of each of the 31
  conformance fixtures against the Go model in the fixture: every day is within 0.05 of
  its share, and the days of every period are within 1.8 visits of its range.

### 3. `clearBenchmarkingData()` clears the insight

- [`clearBenchmarkingData()`](../../../assets/js/modules/analytics-4/datastore/benchmarking.ts#L178)
  first calls
  [`clearBenchmarkingInsight()`](../../../assets/js/modules/analytics-4/datastore/benchmarking-insight.ts#L782),
  which deletes the insight of the dates from the store and from its cache entry, and
  invalidates the resolution of `getBenchmarkingInsight()`.
- The key of the cache entry has the locale that the benchmarking response names. So the
  entry is deleted only while the store has the response for those dates. Otherwise the
  action clears the store alone and sends no request. This covers the QA flow in the
  design doc, where the panel has loaded the dates before the action runs.

### 4. The insight is a polite live region

[`TrafficInsightNotice`](../../../assets/js/modules/analytics-4/components/traffic-overview/components/TrafficInsightNotice.tsx)
and
[`KeyFactorsInsightNotice`](../../../assets/js/modules/analytics-4/components/traffic-overview/factors/KeyFactorsInsightNotice.tsx)
set `aria-live="polite"` on their outer element. It is the same element for the
placeholder and for the insight, so a screen reader reads out the insight once it
arrives.

### 6. Report row limits

- [`REPORT_ROW_LIMIT`](../../../includes/Modules/Analytics_4/Benchmarking/Report_Options.php#L49)
  is 500, far above the rows the response and the insight request keep. The GA4 dimension
  reports and both Search Console requests use it.
- As far as I know, GA4 counts the limit over all rows of a response, so a report with
  both periods has about 250 rows for each. How often a cut still reaches a "top 10 by
  change" list on real sites is not measured.

## Decisions needed

### 5. The wait is not cancelled

The doc says the wait stops when the date range changes or the component unmounts.
The control keeps reading the operation for up to 60 seconds per range.

Recommendation: keep it, and say so in the design doc. Reads cost nothing in the service,
and the insight lands in the store and the cache, ready for a return to the range.
Cancelling a resolver's control needs machinery of its own.

### 7. History is counted from the first day with visits

- [`Period_Baseline::from_daily_series()`](../../../includes/Modules/Analytics_4/Benchmarking/Period_Baseline.php#L259)
  trims leading zero-visit days before the model sees the series, for the chart and for
  the insight request. The Go model counts from the earliest row. This is deliberate and
  tested, and on real Analytics rows it matches what the Go client does.
- One side effect: `visits.last_year` is dropped when the first fetched day has 0
  visits, because the fetched window starts exactly on the first day of last year's
  previous window. It only costs the "also rose at this time last year" clause, on
  low-traffic sites.

Recommendation: keep it.

### 8. A failed generation keeps its operation for up to an hour

The doc says a failure keeps nothing. The code keeps the pending operation after a
500 on a read, so a reload reads the failure rather than paying for a new generation.
It is deliberate (code comment) and tested. Confirm it is the behaviour you want.

Recommendation: keep it. A new generation on every reload can spend the service's rate
limit, and a 429 also blocks the insight for an hour. The panel has no retry for the
insight.

## Tests added

### For gaps in the change

Each test closes a gap where a realistic regression passed every existing test.

[`benchmarking-insight.test.ts`](../../../assets/js/modules/analytics-4/datastore/benchmarking-insight.test.ts):

| Test | Gap it closes |
| :-- | :-- |
| Stops asking at the deadline (409, 503) | The retry loop had no test past one retry: a POST every 5 s forever failed nothing |
| 429 without a `retryAfter` is kept an hour | All 429 rows passed a number; the fallback was unpinned |
| 403 on a read drops the operation, keeps the refusal | No test |
| 400 on a read drops the operation, keeps nothing | No test |
| A read that fails without a status keeps the operation | No test used a network error |
| An operation done without an insight | No test |
| Malformed cache entries are ignored (5 shapes) | Without the shape checks the placeholder would never end |
| A submit keeps the insight of another date range | Nothing pinned the cache group against `API.set()`'s invalidation |
| A failed benchmarking request sends no insight request | Only the hook's guard was tested |
| The insight is still kept one second before a day ends | The old assertion passed with a one-hour lifetime |

[`useBenchmarkingInsight.test.ts`](../../../assets/js/modules/analytics-4/components/traffic-overview/hooks/useBenchmarkingInsight.test.ts):

| Test | Gap it closes |
| :-- | :-- |
| Two uses of the hook send one request | The panel and the footer both use it; nothing covered the shared resolution |
| A disabled hook ignores a response that carries a payload | The old test had no response and asserted before a resolver could start |

PHPUnit:

| File | Test | Gap it closes |
| :-- | :-- | :-- |
| [`Create_Benchmarking_InsightTest.php`](../../../tests/phpunit/integration/Modules/Analytics_4/Datapoints/Create_Benchmarking_InsightTest.php), [`Get_Benchmarking_InsightTest.php`](../../../tests/phpunit/integration/Modules/Analytics_4/Datapoints/Get_Benchmarking_InsightTest.php) | A view-only reader whose owner is disconnected gets 403 and no service request (3 owner states each) | Design-doc test item 3 had no test |
| `Create_Benchmarking_InsightTest.php` | The token is read after the client refreshed it | Every stand-in's `authorize()` threw or did nothing |
| `Create_Benchmarking_InsightTest.php` | A refresh the proxy refuses with a code gives 403 | `Google_Proxy_Code_Exception` was referenced by no test |
| [`Insight_PayloadTest.php`](../../../tests/phpunit/integration/Modules/Analytics_4/Benchmarking/Insight_PayloadTest.php) | A body with `-` and `_` decodes | No fixture produced them, so the `strtr()` in the decoder was untested; a title with `?` would be refused |
| [`Period_BaselineTest.php`](../../../tests/phpunit/integration/Modules/Analytics_4/Benchmarking/Period_BaselineTest.php) | 400 days without visits give 0 to 34 | No conformance fixture reaches the floors or the zero guards; the values are the ones the service's own test asserts |
| [`Response_EncoderTest.php`](../../../tests/phpunit/integration/Modules/Analytics_4/Benchmarking/Response_EncoderTest.php) | Members 9 and 10 by literal position | The test read them through the constants, so swapped constants passed |

The owner-state helper is in
[`Benchmarking_Insight_Datapoints_Trait.php`](../../../tests/phpunit/includes/Benchmarking_Insight_Datapoints_Trait.php).

> [!WARNING]
> The `no_token` owner state is the new test I am least sure of. The plugin registers
> its own `googlesitekit_is_module_recoverable` filter when it loads, and I expect it
> to be live in the test harness, where it would mark the module recoverable once the
> owner has no token. The helper removes that filter to reach the datapoint's own
> guard. If the case fails, expect `missing_required_scopes` in place of
> `missing_access_token`.

### For the decisions

Jest:

| File | Test | Decision |
| :-- | :-- | :-- |
| `benchmarking-insight.test.ts` | `clearBenchmarkingData()` deletes the insight of its dates and its cache entry, and keeps the insight of another date range | 3 |
| `benchmarking-insight.test.ts` | The insight is asked for again once its dates are selected again | 3 |
| `benchmarking-insight.test.ts` | No request is sent when the store has no benchmarking response for the dates | 3 |
| `benchmarking-insight.test.ts` | `clearBenchmarkingInsight()` refuses a date that is not `YYYY-MM-DD` | 3 |
| [`TrafficInsightNotice.test.tsx`](../../../assets/js/modules/analytics-4/components/traffic-overview/components/TrafficInsightNotice.test.tsx), [`KeyFactors.test.tsx`](../../../assets/js/modules/analytics-4/components/traffic-overview/factors/KeyFactors.test.tsx) | The same polite live region holds the placeholder and then the insight | 4 |

PHPUnit:

| File | Test | Decision |
| :-- | :-- | :-- |
| `Get_Benchmarking_InsightTest.php` | A 409, 429 or 503 from the read is a 500; a 400 or 403 passes through | 1 |
| `Period_BaselineTest.php` | The daily ranges of each conformance fixture are the shares of the Go model's range, and add up to the range | 2 |
| `Period_BaselineTest.php` | `from_daily_series()` counts the history from the first day with visits, and has none without visits; `get_history_days()` counts from the earliest row | 2 |
| [`Response_BuilderTest.php`](../../../tests/phpunit/integration/Modules/Analytics_4/Benchmarking/Response_BuilderTest.php) | A steady year gives 83.6 to 116.4 on each day; each day has the share `Period_Baseline` gives it; the days add up to the insight request's `baseline`; a weekend day gets a lower band | 2 |
| `Response_BuilderTest.php` | 84 days of history give the period a band, 83 and 46 give none; the period's own visits don't move the band; a period without visits after a year of visits gets that year's band | 2 |
| [`Report_OptionsTest.php`](../../../tests/phpunit/integration/Modules/Analytics_4/Benchmarking/Report_OptionsTest.php), `Response_BuilderTest.php` | Dimension reports ask for 500 rows, and the contextual data filter receives 500 | 6 |

## Story fix

[`KeyFactors.stories.tsx`](../../../assets/js/modules/analytics-4/components/traffic-overview/factors/KeyFactors.stories.tsx):
`KeyFactors` shows an insight where there are no cards, so the `NoNotableChange` story
rendered the insight in place of the notice its VRT reference shows. I removed the
story's `insight` arg.

## Test gaps I left open

| Gap | Why I left it |
| :-- | :-- |
| `Response_Builder` with a year of rows gives `visits.last_year` | The builder tests with a year of rows check the `baseline` and the band, not last year's totals |
| Second sort key of referrers, and search queries ordered by change | The existing rows are ordered the same way without those keys. Needs fixtures I did not trace |
| `Insight_Payload::MAX_LENGTH` at the boundary | The existing payloads are about 245,000 and 350,000 characters, so any limit between them passes |
| A service answer that is not a JSON object | `failed_to_parse_response` appears in no test |
| Stories for the loading insight and for an insight without cards | New VRT references need a VRT run |
| Panel tests that pass without their gating | Several "shows no insight" tests have no insight in the store, so they pass with the gate removed |
| Nothing keeps the 31 copied fixtures in sync with the service | They are byte-identical today (`diff -rq`); only their count is asserted |

## Scope compared with the plan

- **Not sent in the request:** `decomposition`, `search_clicks`, `channel_breakdowns`,
  `channel_pages`, `channel_campaigns`, `top_pages`, `previous_top_pages`.
- **`recent_content_momentum`** comes from the custom-dimension content report, not
  from landing pages joined to WordPress posts.
- **Not built:** the feedback datapoint and controls, content markers, and an
  `isLoadingBenchmarkingInsight` selector.
- **No key factor cards in real responses.** `Response_Encoder` reads `keyFactors`,
  but nothing in `includes/` produces it. This predates the change, and it is why the
  section shows the driver text without cards.

## Confirmed correct

These come from reading the plugin and the service side by side, not from a run.

- **Contract:** every request key and type matches the service, and I found no
  builder output the service would refuse with a 400. The client loop matches the
  service's client contract (poll every 2 s, one resubmit on 404, on `FAILED` with
  503, or after two minutes).
- **Baseline model:** I found no place where `Period_Baseline` computes a different
  result from the Go model for the same rows. The 31 conformance fixtures are
  byte-identical to the service's, and the conformance test is the real check of the
  arithmetic once you run it.
- **Security:** the payload is signed per user with HMAC-SHA256 and checked before
  anything is sent; a foreign or changed payload is a 400 with no service request.
- **Permissions:** both datapoints are shareable, declare `VIEW_DASHBOARD`, and exist
  only with both feature flags on.
- **Rendering:** the model's text is rendered as React children; only `**…**`
  becomes `<strong>`.
- **Cache isolation:** the insight's cache group is not matched by the invalidation
  that follows a POST to the datapoint.

## Where the plugin design docs are out of date

The implementation follows the service; the docs
([`traffic-insights-design-doc.md`](./traffic-insights-design-doc.md) and, for the band,
[`typical-traffic-design-doc.md`](./typical-traffic-design-doc.md)) still say otherwise:

- The response field is `analysis`, not `text`; scenario labels are
  `<STATUS>.<DIRECTION>`.
- `hl` is the WordPress locale (`de_DE_formal`), not a hyphenated tag.
- `days_in_period` is the selected range (7, 14, 28 or 90), not always 28.
- The request has `visits.last_year` and `history_days`; `baseline` is only the two
  range bounds.
- Error bodies are `{"error", "code"}`, a 429 carries `Retry-After`, and the plugin
  sends a `User-Agent`.
- The payload is signed, in place of the structural validation the doc describes.
- The chart's band is the period's range from `Period_Baseline`, spread over the days by
  weekday (§5.6 of the service doc). Both docs describe `Expected_Baseline`, a per-day fit
  that gives a day a band from 28 days of history.
- The insight's state and cache entry are cleared by `clearBenchmarkingInsight()`, which
  `clearBenchmarkingData()` calls first.

## Nits

- The store waits fixed 2 s and 5 s rather than the `Retry-After` it is given;
  `reason` is forwarded and unused.
- The deadline is 60 s; the doc suggests about 40 s as an open question.
- `PLACEHOLDER_TRAFFIC_INSIGHT` and `PLACEHOLDER_KEY_FACTORS_INSIGHT` are used only by
  stories now, and live in production modules.
- `Get_Benchmarking_InsightTest::data_failed_operations` uses values the service does
  not send (`UNAVAILABLE`, code 13); the real ones are `SERVICE_BUSY` with 503, and
  500 with `MODEL_OUTPUT_INVALID` and the like.
- The `canResubmit` false branch of the two-minute rule cannot be reached inside the
  60 s deadline.
- The insight hook can start before the gathering-data state is known.
