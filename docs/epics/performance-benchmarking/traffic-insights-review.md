# Review: traffic insights on the Traffic Overview panel

## Verdict

The staged change is correct against the **service's current contract**, and I found no
wire-level mismatch between the plugin and the service. It does not match the plugin
design doc on several points, because that doc is older than the service contract
(list at the end). Eight items need your decision; none of them is a test gap.

I added 26 test cases (16 in Jest, 10 in PHPUnit), made two existing tests stricter and
fixed one story. All of it is **unstaged**, on top of your staged change.

> [!IMPORTANT]
> No test was run, as you asked. What I did run, read-only:
> - ESLint on the three JS files I touched: clean.
> - `tsc --noEmit` on the project: exit 0.
>
> This machine has no `php` binary, so the PHP edits were neither syntax-checked nor
> linted. Every expected value in the new tests comes from reading the code.

## Decisions needed

### 1. A failed read of the operation is passed through as 503, 409 or 429

- [`PASSED_ERROR_STATUSES`](file:///usr/local/google/home/manuilov/Work/site-kit-wp/includes/Modules/Analytics_4/Datapoints/Benchmarking_Insight_Datapoint.php#L49)
  is shared by both datapoints, so `GET:benchmarking-insight` answers an HTTP 503 of
  the operations endpoint as 503.
- The plugin design doc says a 5xx from the operations endpoint itself is a 500, and
  503 is kept for an operation that `FAILED` with code 503.
- The store acts on the difference. In
  [`readOperation`](file:///usr/local/google/home/manuilov/Work/site-kit-wp/assets/js/modules/analytics-4/datastore/benchmarking-insight.ts#L547-L602)
  a 503 on a read drops the pending operation and asks for the insight again, which
  the design keeps for a generation that was lost. A 429 on a read drops the
  operation and is kept as a refusal for at least an hour.
- `Get_Benchmarking_InsightTest::data_service_errors` has no 503 row. I added none: a
  row for today's behaviour would cement the deviation, and a row for the designed
  behaviour would fail.

### 2. The chart's band and the insight's verdict come from two models

- [`Response_Builder::build()`](file:///usr/local/google/home/manuilov/Work/site-kit-wp/includes/Modules/Analytics_4/Benchmarking/Response_Builder.php#L102-L136)
  draws the chart band from
  [`Expected_Baseline`](file:///usr/local/google/home/manuilov/Work/site-kit-wp/includes/Modules/Analytics_4/Benchmarking/Expected_Baseline.php)
  and sends the insight's range from
  [`Period_Baseline`](file:///usr/local/google/home/manuilov/Work/site-kit-wp/includes/Modules/Analytics_4/Benchmarking/Period_Baseline.php).
- The service doc
  ([§5.6](file:///usr/local/google/home/manuilov/Work/site-kit-service/docs/benchmarking_feature_design.md#L371-L375))
  requires "the band under the judged period is the band its verdict used", and notes
  the plugin has no implementation of that part yet.
- So the panel can say visits were above what is usual while the chart shows them
  inside its band. `Expected_Baseline` predates this change; the insight makes the
  difference visible. I did not measure how far the two models diverge.

### 3. `clearBenchmarkingData()` does not clear the insight

[`benchmarking.ts`](file:///usr/local/google/home/manuilov/Work/site-kit-wp/assets/js/modules/analytics-4/datastore/benchmarking.ts)
is not in the staged change. The design doc asks the action to clear the insight's
state, pending operation and cache entry. It has no production caller (the panel's
retry uses `invalidateResolution`), so today this affects QA and the tester plugin.

### 4. No live region for the insight

[`TrafficInsightNotice`](file:///usr/local/google/home/manuilov/Work/site-kit-wp/assets/js/modules/analytics-4/components/traffic-overview/components/TrafficInsightNotice.tsx)
and
[`KeyFactorsInsightNotice`](file:///usr/local/google/home/manuilov/Work/site-kit-wp/assets/js/modules/analytics-4/components/traffic-overview/factors/KeyFactorsInsightNotice.tsx)
have no `aria-live` or `role="status"`. The design doc's accessibility section asks
for a polite live region, since the text arrives seconds after the figures.

### 5. The wait is not cancelled

The doc says the wait stops when the date range changes or the component unmounts.
The control keeps reading the operation for up to 60 seconds per range.

### 6. Report row limits can distort the "top 10 by change" lists

- GA4 dimension reports and both Search Console requests are limited to 50 rows.
- A row present in only one period is paired with 0, so a query that only crossed
  rank 50 looks like "+N from zero" and can enter `search_query_shifts` or
  `referrers`.
- The service doc (§5.2) warns that a client that limits a report must fetch enough
  rows that the cut is unaffected. The pairing predates this change; the insight
  request now depends on it. How often it changes the top 10 on real sites is not
  measured.

### 7. History is counted from the first day with visits

- [`Insight_Request_Builder`](file:///usr/local/google/home/manuilov/Work/site-kit-wp/includes/Modules/Analytics_4/Benchmarking/Insight_Request_Builder.php)
  trims leading zero-visit days before the model sees the series. The Go model counts
  from the earliest row. This is deliberate and tested, and on real Analytics rows it
  matches what the Go client does.
- One side effect: `visits.last_year` is dropped when the first fetched day has 0
  visits, because the fetched window starts exactly on the first day of last year's
  previous window. It only costs the "also rose at this time last year" clause, on
  low-traffic sites.

### 8. A failed generation keeps its operation for up to an hour

The doc says a failure keeps nothing. The code keeps the pending operation after a
500 on a read, so a reload reads the failure rather than paying for a new generation.
It is deliberate (code comment) and tested. Confirm it is the behaviour you want.

## Tests added

Each test closes a gap where a realistic regression passed every existing test.

### Jest

[`benchmarking-insight.test.ts`](file:///usr/local/google/home/manuilov/Work/site-kit-wp/assets/js/modules/analytics-4/datastore/benchmarking-insight.test.ts):

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

[`useBenchmarkingInsight.test.ts`](file:///usr/local/google/home/manuilov/Work/site-kit-wp/assets/js/modules/analytics-4/components/traffic-overview/hooks/useBenchmarkingInsight.test.ts):

| Test | Gap it closes |
| :-- | :-- |
| Two uses of the hook send one request | The panel and the footer both use it; nothing covered the shared resolution |
| A disabled hook ignores a response that carries a payload | The old test had no response and asserted before a resolver could start |

### PHPUnit

| File | Test | Gap it closes |
| :-- | :-- | :-- |
| [`Create_Benchmarking_InsightTest.php`](file:///usr/local/google/home/manuilov/Work/site-kit-wp/tests/phpunit/integration/Modules/Analytics_4/Datapoints/Create_Benchmarking_InsightTest.php), [`Get_Benchmarking_InsightTest.php`](file:///usr/local/google/home/manuilov/Work/site-kit-wp/tests/phpunit/integration/Modules/Analytics_4/Datapoints/Get_Benchmarking_InsightTest.php) | A view-only reader whose owner is disconnected gets 403 and no service request (3 owner states each) | Design-doc test item 3 had no test |
| `Create_Benchmarking_InsightTest.php` | The token is read after the client refreshed it | Every stand-in's `authorize()` threw or did nothing |
| `Create_Benchmarking_InsightTest.php` | A refresh the proxy refuses with a code gives 403 | `Google_Proxy_Code_Exception` was referenced by no test |
| [`Insight_PayloadTest.php`](file:///usr/local/google/home/manuilov/Work/site-kit-wp/tests/phpunit/integration/Modules/Analytics_4/Benchmarking/Insight_PayloadTest.php) | A body with `-` and `_` decodes | No fixture produced them, so the `strtr()` in the decoder was untested; a title with `?` would be refused |
| [`Period_BaselineTest.php`](file:///usr/local/google/home/manuilov/Work/site-kit-wp/tests/phpunit/integration/Modules/Analytics_4/Benchmarking/Period_BaselineTest.php) | 400 days without visits give 0 to 34 | No conformance fixture reaches the floors or the zero guards; the values are the ones the service's own test asserts |
| [`Response_EncoderTest.php`](file:///usr/local/google/home/manuilov/Work/site-kit-wp/tests/phpunit/integration/Modules/Analytics_4/Benchmarking/Response_EncoderTest.php) | Members 9 and 10 by literal position | The test read them through the constants, so swapped constants passed |

The owner-state helper is in
[`Benchmarking_Insight_Datapoints_Trait.php`](file:///usr/local/google/home/manuilov/Work/site-kit-wp/tests/phpunit/includes/Benchmarking_Insight_Datapoints_Trait.php).

> [!WARNING]
> The `no_token` owner state is the new test I am least sure of. The plugin registers
> its own `googlesitekit_is_module_recoverable` filter when it loads, and I expect it
> to be live in the test harness, where it would mark the module recoverable once the
> owner has no token. The helper removes that filter to reach the datapoint's own
> guard. If the case fails, expect `missing_required_scopes` in place of
> `missing_access_token`.

## Story fix

[`KeyFactors.stories.tsx`](file:///usr/local/google/home/manuilov/Work/site-kit-wp/assets/js/modules/analytics-4/components/traffic-overview/factors/KeyFactors.stories.tsx):
the staged `KeyFactors` shows an insight where there are no cards, so the
`NoNotableChange` story rendered the insight in place of the notice its VRT reference
shows. I removed the story's `insight` arg. The file was not in your staged change.

## Test gaps I left open

| Gap | Why I left it |
| :-- | :-- |
| A 503 from the operations endpoint on `GET:benchmarking-insight` | Needs decision 1 first |
| `clearBenchmarkingData()` clears the insight | Not implemented (decision 3) |
| `Response_Builder` with a year of rows gives `baseline` and `visits.last_year` | Every builder test has two daily rows. I could not derive the expected range without running the model |
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

## Where the plugin design doc is out of date

The implementation follows the service; the doc
([`traffic-insights-design-doc.md`](file:///usr/local/google/home/manuilov/Work/site-kit-wp/docs/epics/performance-benchmarking/traffic-insights-design-doc.md))
still says otherwise:

- The response field is `analysis`, not `text`; scenario labels are
  `<STATUS>.<DIRECTION>`.
- `hl` is the WordPress locale (`de_DE_formal`), not a hyphenated tag.
- `days_in_period` is the selected range (7, 14, 28 or 90), not always 28.
- The request has `visits.last_year` and `history_days`; `baseline` is only the two
  range bounds.
- Error bodies are `{"error", "code"}`, a 429 carries `Retry-After`, and the plugin
  sends a `User-Agent`.
- The payload is signed, in place of the structural validation the doc describes.

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
