# Benchmarking response — the expected range for each plotted day, in the response and the wire format

## Feature Description

The Typical Traffic chart is going to draw an expected range under its line: for each day, the lowest and the highest number of visits that the site's own history makes normal for that day. `Expected_Baseline` (#13798) computes that range. This issue adds the range to the benchmarking response, so the browser gets it with each day's visits. Drawing it on the chart is #13800.

<img width="868" height="230" alt="Image" src="https://github.com/user-attachments/assets/1302fa79-d6b6-4155-9538-a8af20990030" />

Each day's range is fitted on up to a year of history that ends on that day. The daily report therefore starts a year before the selected range, instead of at the start of the period before it. The extra days are used only for the fit and are never sent to the browser.

A day has no range until the site has 28 days of history, counted from its first day with recorded traffic.

The range travels to the browser as a new member of the encoded response. The format version stays `1`, because no response in format `1` has been released to users.

This issue builds on the daily series and the selected-range `dailyTraffic` from #13600, and on the `visits` names from #13844.

Link to the design doc: https://docs.google.com/document/d/1dsEs6-NjlP_LNqz5md5fnJMuxh9Vd9f88w4DTrZdLok/edit?tab=t.y7e2u5h52vf1

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* The daily report runs in the same batched call as before, and the response still takes at most two calls to Analytics. It starts 364 days before `startDate` and ends on `endDate`:
  * For `2026-08-19` to `2026-09-15`, it covers the 392 days from `2025-08-20`.
  * For `2026-06-18` to `2026-09-15`, it covers the 454 days from `2025-06-19`.
* `dailyTraffic` still holds one row for each day from `startDate` to `endDate`, and no earlier day of the report appears in the response.
* Each `dailyTraffic` row carries `date`, `visits`, `expectedMin` and `expectedMax`. The two bounds are the ones `Expected_Baseline` returns for that day, fitted on the zero-filled daily report up to and including that day, each with at most one decimal.
* A day that has fewer than 28 days from the first day with recorded traffic, up to and including itself, has `null` for both bounds. On a series with `0` visits on every day before `2026-08-01`, every row before `2026-08-28` has `null` bounds, and every row from `2026-08-28` on has both.
* Changing the visits on `2026-09-15` does not change the bounds of any earlier day.
* `visits.current` and `visits.previous` are unchanged.
* With `typicalTraffic` enabled, the response to a `GET` to `/google-site-kit/v1/modules/analytics-4/data/benchmarking-data?startDate=2026-08-19&endDate=2026-09-15` has eight members. Members `0` to `6` are unchanged, and the format version in member `0` stays `1`. Member `7` holds one entry for each daily count in member `3`, in the same order: `[ expectedMin, expectedMax ]` for a day with a range, and `null` for a day without one.
* The decoder gives each `dailyTraffic` row the bounds from the matching entry of member `7`, unchanged, and `null` for both when the entry is `null`.
* An encoded response that does not have eight members, or whose member `7` does not have one entry for each daily count, decodes to nothing, and the store records `benchmarking_decode_failed`.

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
