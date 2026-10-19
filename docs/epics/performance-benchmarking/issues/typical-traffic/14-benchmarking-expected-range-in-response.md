# Benchmarking response — the expected range for each plotted day, in the response and the wire format

## Feature Description

The Typical Traffic chart is going to draw an expected range under its line: for every day, the lowest and the highest number of visits that the site's own history makes normal for that day. `Expected_Baseline` computes that range in PHP from a daily series of visits. But `GET:benchmarking-data` does not call it, and the response has no place for the result. Each `dailyTraffic` row carries a date and a count and nothing else, and the encoded response from #13593 has no member for the bounds.

This issue puts the expected range into the response: two more numbers on every `dailyTraffic` row, `expectedMin` and `expectedMax`, computed on the server and carried to the browser in the wire format.

**The daily report gets longer, but the chart does not.** The chart plots the days of the selected date range, which #13600 narrows `dailyTraffic` to. The fit for each of those days reads up to 365 days of history ending on that day, so the earliest plotted day needs the 364 days before it. The daily report therefore starts 364 days before the first day of the selected range, instead of on the first day of the period before it: it covers 392 days for a 28-day range, and 454 days for a 90-day range. Only the days of the selected range become `dailyTraffic` rows. The other 364 days are read by the fits and are never sent to the browser. The report is still one request in the same batched call, so this adds no request.

**Each plotted day gets the bounds fitted on its own history.** A day's bounds come from the fit for that day, which reads the series up to and including that day and nothing after it. A day that does not have 28 days of recorded traffic behind it gets no bounds. This happens after a long run of zeros at the start of the series, for example when the site was tagged long after the property was created. On those days both bounds are `null`.

**The totals do not change.** `visits.current` and `visits.previous` are still sums over the selected period and the period before it. A period has at most 90 days, so the longer report always starts before the period before the selected one, and a longer report does not change the totals.

**The wire format gains one member.** The bounds travel as member `7` of the encoded response: one `[ expectedMin, expectedMax ]` pair for each daily count in member `3`, in the same order, or `null` for a day without a band. The bounds are rounded to one decimal before they are encoded, as every other non-integer in the format is, and the browser does not round them again. The format version stays `1`, because no response in format `1` has been released to users.

Concretely, the first three plotted days of a response decode to this:

```json
"dailyTraffic": [
	{ "date": "2025-08-18", "visits": 132, "expectedMin": null, "expectedMax": null },
	{ "date": "2025-08-19", "visits": 0, "expectedMin": 118.4, "expectedMax": 183.1 },
	{ "date": "2025-08-20", "visits": 147, "expectedMin": 124.3, "expectedMax": 191.5 }
]
```

and travel as members `2`, `3` and `7`:

```json
"2025-08-18",
[ 132, 0, 147 ],
...,
[ null, [ 118.4, 183.1 ], [ 124.3, 191.5 ] ]
```

The first day has no band because it is only the 27th day counted from the site's first day with recorded traffic. The second day has a band although it had no visits: a day without traffic is still a day the site's history has an expectation for.

The checked-in fixture that both the PHP encoder test and the JavaScript decoder test read gains member `7`, so a change to the bounds on one side without the other still fails one of the two tests.

This issue needs `Expected_Baseline` from #13798, which computes the bounds, the response assembly from #13595, the wire format from #13593, the daily series and the selected-range `dailyTraffic` that #13600 splits apart, and the `visits` names #13844 gives the totals and each day's count. The decoded rows are what the `benchmarking` slice from #13598 stores, so they reach the panel from #13599 with the bounds on them. Drawing the bounds on the chart from #13600 is separate work.

Link to the design doc: https://docs.google.com/document/d/1dsEs6-NjlP_LNqz5md5fnJMuxh9Vd9f88w4DTrZdLok/edit?tab=t.y7e2u5h52vf1

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* For a request with `startDate=2026-08-19` and `endDate=2026-09-15`, the daily report covers the 392 days from `2025-08-20` to `2026-09-15`, ascending, and is run in the same batched call as before, so the response still needs at most two calls to Analytics.
* For a request with `startDate=2026-06-18` and `endDate=2026-09-15`, the daily report covers the 454 days from `2025-06-19` to `2026-09-15`.
* `dailyTraffic` still holds one row for each day of the selected range — `2026-08-19` to `2026-09-15` for the first request — and the 364 earlier days of the report appear nowhere in the response.
* Every `dailyTraffic` row carries `date`, `visits`, `expectedMin` and `expectedMax`.
* A row's `expectedMin` and `expectedMax` are the bounds `Expected_Baseline` returns for that row's day, fitted on the zero-filled daily report up to and including that day.
* A row whose day has fewer than 28 days from the first day with recorded traffic up to and including that day has `expectedMin: null` and `expectedMax: null`. Every other row has both bounds as numbers with at most one decimal.
* On a property whose series has recorded traffic on every day of the report, every `dailyTraffic` row has both bounds.
* On a series with `0` visits on every day before `2026-08-01` and traffic from that day on, every row before `2026-08-28` has `null` bounds, and every row from `2026-08-28` on has both bounds.
* `visits.current` and `visits.previous` are the same sums over the same two periods as before.
* Two requests ending on `2026-09-15` whose daily series differ only on `2026-09-15` return the same bounds for every day before `2026-09-15`.
* The encoded response is an array of eight members. Members `0` to `6` are unchanged, and member `7` holds one entry for each daily count in member `3`, in the same order:
  * `[ expectedMin, expectedMax ]` for a day with a band, each rounded to one decimal.
  * `null` for a day without a band.
* The format version in member `0` stays `1`.
* The decoder gives each `dailyTraffic` row the `expectedMin` and `expectedMax` from the matching entry of member `7`, unchanged, and `null` for both when the entry is `null`.
* An encoded response that is not an array of eight members, or whose member `7` does not have one entry for each daily count, decodes to nothing and is reported as an unusable response.
* The checked-in `benchmarking-data.json` carries member `7` with at least one day that has a band and one that does not. Encoding the fixed set of values in the PHP test produces that file, and decoding that file in the JavaScript test produces `dailyTraffic` rows with the matching bounds.

## Implementation Brief

* [ ] In `includes/Modules/Analytics_4/Benchmarking/Report_Options.php`:
  * In `get_daily_series_options()`, start the report `Expected_Baseline::MAXIMUM_HISTORY_DAYS - 1` days before `$start_date`, in place of the first day of the compare period that #13600 starts it on. `Expected_Baseline` is added in #13798. A period has at most `MAXIMUM_PERIOD_DAYS` days, so that day always comes before the first day of the compare period, and the report still holds both periods. Update the method's docblock.

* [ ] In `includes/Modules/Analytics_4/Benchmarking/Wire_Format.php`:
  * Add `MEMBER_DAILY_EXPECTED_RANGES`, set to `7`, after `MEMBER_DIMENSION_ORDER`. Leave `FORMAT_VERSION` at `1`.
  * Add `EXPECTED_RANGE_DECIMAL_PLACES`, set to `1`. The docblock of `POSITION_DECIMAL_PLACES` says that every other number is an integer; change it so that it names the expected range's bounds as well.

* [ ] In `includes/Modules/Analytics_4/Benchmarking/Response_Builder.php`:
  * Give `get_daily_traffic()` (added in #13600) a third parameter, `Expected_Baseline $expected_baseline`:
    * It still returns the days of the daily series from `$start_date` on, oldest first.
    * Each row is `array( 'date' => …, 'visits' => …, 'expectedMin' => …, 'expectedMax' => … )`, with the keys in that order.
    * The two bounds come from `$expected_baseline->get_fit( $position )`, where `$position` is the day's position in the daily series, not its position in the returned list.
  * In `build()`:
    * Create one `Expected_Baseline` from the daily series `get_daily_series()` builds, and pass it to `get_daily_traffic()`. Keep the `Expected_Baseline` instance in a variable of `build()`, because #13841 reads the week ahead from the same instance.
    * Keep summing `visits.current` and `visits.previous` with `sum_visits()` over the daily series.
    * Update the `@return` description of `dailyTraffic`: the days of the selected period, oldest first, each with `date`, `visits`, `expectedMin` and `expectedMax`.

* [ ] In `includes/Modules/Analytics_4/Benchmarking/Response_Encoder.php`:
  * In `encode()`, write member `Wire_Format::MEMBER_DAILY_EXPECTED_RANGES`: one entry for each `dailyTraffic` row, in the same order as the counts in `Wire_Format::MEMBER_DAILY_VISITS`. An empty `dailyTraffic` gives an empty array.
  * Add a private `encode_expected_range( array $row )`, next to `encode_position()`:
    * It returns `null` when `expectedMin` or `expectedMax` is missing from the row or is `null`.
    * Otherwise it returns `array( expectedMin, expectedMax )`, each as `round( (float) $value, Wire_Format::EXPECTED_RANGE_DECIMAL_PLACES )`.
  * Add the two bounds of a `dailyTraffic` row to the `@param` description of `encode()`.

* [ ] In `assets/js/modules/analytics-4/utils/benchmarking/constants.ts`:
  * Add `MEMBER_DAILY_EXPECTED_RANGES`, set to `7`.

* [ ] In `assets/js/modules/analytics-4/utils/benchmarking/types.ts`:
  * Add `expectedMin: number | null` and `expectedMax: number | null` to `BenchmarkingDailyTrafficRow`, each with a doc comment that says the value is `null` on a day without a band.

* [ ] In `assets/js/modules/analytics-4/utils/benchmarking/decodeBenchmarkingResponse.ts`:
  * Raise `MEMBER_COUNT` to `8`.
  * Add two checks to `membersHoldTheirShapes`, so that a response that fails either one decodes to `null`:
    * Member `MEMBER_DAILY_EXPECTED_RANGES` is an array with as many entries as member `MEMBER_DAILY_VISITS`.
    * Each of its entries is `null` or an array of two numbers.
  * Add a third parameter to `decodeDailyTraffic()`, `expectedRanges: ( [ number, number ] | null )[]`. Give each row the first number of its entry as `expectedMin` and the second as `expectedMax`, unchanged, or `null` for both when the entry is `null`.
  * In `decodeBenchmarkingResponse()`, pass member `MEMBER_DAILY_EXPECTED_RANGES` to `decodeDailyTraffic()`.

* [ ] In `assets/js/modules/analytics-4/datastore/__fixtures__/benchmarking-data.json`:
  * Add member `7`: `[ null, [ 118.4, 183.1 ], [ 124.3, 191.5 ], [ 117.9, 182.6 ] ]`, one entry for each of the four daily counts in the fixture. The first day has no band, and the other three have one.

The week ahead is #13841. Drawing the bounds on the chart is #13800.

### Test Coverage

* In `tests/phpunit/integration/Modules/Analytics_4/Benchmarking/Report_OptionsTest.php`:
  * Change the `get_daily_series_options()` tests from #13600 to expect the report to start 364 days before the period's first day: on `2025-08-20` for `2026-08-19` to `2026-09-15`, on `2025-09-10` for the 7 days ending on `2026-09-15`, and on `2025-06-19` for the 90 days ending on `2026-09-15`.
* In `tests/phpunit/integration/Modules/Analytics_4/Benchmarking/Response_BuilderTest.php`, on requests for `2026-08-19` to `2026-09-15`:
  * The daily report asks for `2025-08-20` to `2026-09-15`. The existing tests for five reports in one call and seven reports in two calls still pass unchanged.
  * With `100` visits on every day from `2025-08-20` to `2026-09-15`, all 28 `dailyTraffic` rows have the bounds `77.6` to `122.4`.
  * With a daily pattern that changes from day to day, each row's bounds are the bounds that `Expected_Baseline::get_fit()` returns for the same day of the same daily report.
  * With `100` visits on every day from `2025-08-20` to `2026-08-18` and none after that, `dailyTraffic` still starts on `2026-08-19`, its rows have `0` visits and both bounds, and no day before `2026-08-19` is in the response.
  * With visits only from `2026-08-01` on, every row before `2026-08-28` has `null` for both bounds, and every row from `2026-08-28` on has a number for both.
  * Two builds whose daily rows differ only on `2026-09-15` return the same bounds on every earlier row.
  * Update `test_build__lists_0_visits_for_a_day_analytics_returned_no_row_for` to expect `expectedMin` and `expectedMax` as `null` on its three rows.
  * Make `test_build__does_not_return_a_number_with_decimals` skip the `expectedMin` and `expectedMax` of each `dailyTraffic` row, and assert instead that each of them is `null` or is equal to itself rounded to one decimal.
* In `tests/phpunit/integration/Modules/Analytics_4/Benchmarking/Response_EncoderTest.php`:
  * Add the bounds of the fixture's member `7` to the four rows of `get_fixture_response()`, so that the encoded response still matches the checked-in file.
  * Member `7` has one entry for each daily count, in the same order. A row whose bounds are `null`, or a row with no bounds, is encoded as `null`.
  * The bounds `118.44` and `183.16` are encoded as `118.4` and `183.2`.
  * An empty `dailyTraffic` gives an empty member `7`, and the encoded response has eight members.
* In `tests/phpunit/integration/Modules/Analytics_4/Datapoints/Get_Benchmarking_DataTest.php`:
  * In `test_rest_endpoint__answers_with_the_encoded_response`, give the two `dailyTraffic` rows bounds, and assert that member `7` carries them.
* In `assets/js/modules/analytics-4/utils/benchmarking/decodeBenchmarkingResponse.test.ts`:
  * The checked-in fixture decodes to four rows with the bounds of member `7`, unchanged, and with `null` for both bounds on the first row.
  * Each of these decodes to `null`: an envelope of seven or of nine members, a member `7` that is not a list, a member `7` with one entry more or one entry fewer than the daily counts, and an entry that is neither `null` nor two numbers.
  * Add a member `7` with one `null` entry for each daily count to every encoded response written out in the file, including the 395-day one. Change "seven members" to "eight members" in the test names.
* In `assets/js/modules/analytics-4/datastore/benchmarking.test.ts`:
  * Add a member `7` to every response body written out in the file, and `expectedMin` and `expectedMax` to every decoded row the file expects. In the test that returns the decoded fields, give at least one day a pair, and expect it on that day's row.
  * A response whose member `7` has fewer entries than member `3` stores the `benchmarking_decode_failed` error.
* In `assets/js/modules/analytics-4/datastore/__factories__/benchmarking.test.ts`:
  * Add `expectedMin: null` and `expectedMax: null` to the `dailyTraffic` rows written out in the file.
* No Storybook story is required, because no component renders the bounds until #13800.
* No VRT changes expected.

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
