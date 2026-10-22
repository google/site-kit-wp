# Benchmarking response — the expected range for each plotted day and the first day with recorded traffic, in the response and the wire format

## Feature Description

The Typical Traffic chart is going to draw an expected range under its line (#13800): for each day, the visits the site's own history makes normal for that day. This issue adds that range, computed by `Expected_Baseline` (#13798), to each plotted day of the benchmarking response.

<img width="868" height="230" alt="Image" src="https://github.com/user-attachments/assets/1302fa79-d6b6-4155-9538-a8af20990030" />

Each day's range is fitted on up to a year of history that ends on that day, so the daily report starts 364 days before the selected range. The extra days are never sent to the browser.

The response also carries `firstTrafficDate`, the first day with recorded traffic. The expected range's history starts on that day, and the tab's states (#13602) and the key factor cards (#13845) count history from it too.

Both travel as members `7` and `8` of the wire format. The format version stays `1`, because no response in format `1` has been released to users. This issue builds on #13600 and #13844.

Link to the design doc: https://docs.google.com/document/d/1dsEs6-NjlP_LNqz5md5fnJMuxh9Vd9f88w4DTrZdLok/edit?tab=t.y7e2u5h52vf1 (see "Expected range", "Response assembly" and "Wire format layout")

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* With `typicalTraffic` enabled, a `GET` to `/google-site-kit/v1/modules/analytics-4/data/benchmarking-data?startDate=2026-08-19&endDate=2026-09-15` runs a daily report from `2025-08-20` to `2026-09-15`, in at most two calls to Analytics. Its `dailyTraffic` holds only the 28 days from `2026-08-19`.
* Each `dailyTraffic` row carries `expectedMin` and `expectedMax`: the bounds `Expected_Baseline` gives that day, or `null` for both when the day has fewer than 28 days of recorded traffic up to and including it. Changing the visits on `2026-09-15` changes no earlier day's bounds.
* `firstTrafficDate` is the first day of the daily report with visits:

  | Visits in the daily report | Rows with bounds | `firstTrafficDate` | Member `8` |
  | :---- | :---- | :---- | :---- |
  | On every day | All 28 | `2025-08-20` | `-364` |
  | From `2026-08-01` on | From `2026-08-28` on | `2026-08-01` | `-18` |
  | From `2026-08-24` on | None | `2026-08-24` | `5` |
  | None | None | `null` | `null` |

* The encoded response has nine members. Members `0` to `6` are unchanged, and the format version stays `1`. Member `7` holds `[ expectedMin, expectedMax ]`, or `null`, for each day in member `3`, and member `8` holds the number in the table.
* The decoded response carries the bounds on each `dailyTraffic` row and `firstTrafficDate` as `YYYY-MM-DD`, the same in every browser time zone.
* A response decodes to nothing and the store records `benchmarking_decode_failed` when it does not have nine members, when member `7` does not have one entry per day, or when member `8` is neither `null` nor a whole number.

## Implementation Brief

* [ ] In `includes/Modules/Analytics_4/Benchmarking/Report_Options.php`:
  * In `get_daily_series_options()`, start the report `Expected_Baseline::MAXIMUM_HISTORY_DAYS - 1` days before the first day of the selected period, in place of the first day of `get_compare_range()` (#13600). `Expected_Baseline` is added in #13798. Update the method's docblock.

* [ ] In `includes/Modules/Analytics_4/Benchmarking/Wire_Format.php`:
  * Add `MEMBER_DAILY_EXPECTED_RANGES`, set to `7`, and `MEMBER_FIRST_TRAFFIC_DAY_OFFSET`, set to `8`, after `MEMBER_KEY_FACTOR_ATTRIBUTES` (added in #13844).
  * Add `EXPECTED_RANGE_DECIMAL_PLACES`, set to `1`. The docblock of `SHARE_DECIMAL_PLACES` (added in #13844) says that every other number is an integer; change it so that it names the expected range's bounds as well.

* [ ] In `includes/Modules/Analytics_4/Benchmarking/Response_Builder.php`:
  * Give `get_daily_traffic()` (added in #13600) a third parameter, `Expected_Baseline $expected_baseline`:
    * Each row is `array( 'date' => …, 'visits' => …, 'expectedMin' => …, 'expectedMax' => … )`, with the keys in that order.
    * The two bounds come from `$expected_baseline->get_fit( $position )`, where `$position` is the day's position in the daily series, not its position in the returned list.
  * Add a private `get_first_traffic_date( array $daily_series )`. It returns the `date` of the first day in the series whose `visits` is above `0`, or `null` when there is none. #13845 reads the same value to decide whether it can choose cards.
  * In `build()`:
    * Create one `Expected_Baseline` from the daily series `get_daily_series()` builds, and pass it to `get_daily_traffic()`.
    * Return `firstTrafficDate` from `get_first_traffic_date()` of the whole daily series, after `dailyTraffic`.
    * Update the `@return` description: `dailyTraffic` holds the days of the selected period, oldest first, each with `date`, `visits`, `expectedMin` and `expectedMax`, and `firstTrafficDate` is the first day of the daily report with visits, or `null`.

* [ ] In `includes/Modules/Analytics_4/Benchmarking/Response_Encoder.php`:
  * In `encode()`, write member `Wire_Format::MEMBER_DAILY_EXPECTED_RANGES`: one entry for each `dailyTraffic` row, in the same order as the counts in `Wire_Format::MEMBER_DAILY_VISITS`. An empty `dailyTraffic` gives an empty array.
  * Add a private `encode_expected_range( array $row )`, next to `encode_share()` (added in #13844):
    * It returns `null` when `expectedMin` or `expectedMax` is missing from the row or is `null`.
    * Otherwise it returns `array( expectedMin, expectedMax )`, each as `round( (float) $value, Wire_Format::EXPECTED_RANGE_DECIMAL_PLACES )`.
  * In `encode()`, write member `Wire_Format::MEMBER_FIRST_TRAFFIC_DAY_OFFSET` with a private `encode_day_offset( $first_date, $date )`:
    * `$first_date` is the value written to `Wire_Format::MEMBER_FIRST_DATE`, and `$date` is `firstTrafficDate`.
    * It returns `null` when either of them is missing or `null`.
    * Otherwise it returns the number of days from `$first_date` to `$date` as an `int`, negative when `$date` is earlier. Create both dates as `DateTimeImmutable` in UTC, as `Response_Builder` creates the dates of its rows, and divide the difference of their timestamps by `DAY_IN_SECONDS` with `intdiv()`.
  * Add the two bounds of a `dailyTraffic` row and `firstTrafficDate` to the `@param` description of `encode()`. The docblock of `encode_share()` says that a share is the only number the format keeps decimals for; change it so that it names the expected range's bounds as well.

* [ ] In `assets/js/modules/analytics-4/utils/benchmarking/constants.ts`:
  * Add `MEMBER_DAILY_EXPECTED_RANGES`, set to `7`, and `MEMBER_FIRST_TRAFFIC_DAY_OFFSET`, set to `8`.

* [ ] In `assets/js/modules/analytics-4/utils/benchmarking/types.ts`:
  * Add `expectedMin: number | null` and `expectedMax: number | null` to `BenchmarkingDailyTrafficRow`, each with a doc comment that says the value is `null` on a day without a band.
  * Add `firstTrafficDate: string | null` to `DecodedBenchmarkingResponse`, with a doc comment that says it is the first day with recorded traffic, as `YYYY-MM-DD`, or `null` when the site has none.

* [ ] In `assets/js/modules/analytics-4/utils/benchmarking/decodeBenchmarkingResponse.ts`:
  * Raise `MEMBER_COUNT` to `9`.
  * Add these checks to `membersHoldTheirShapes`, so that a response that fails any of them decodes to `null`:
    * Member `MEMBER_DAILY_EXPECTED_RANGES` is an array with as many entries as member `MEMBER_DAILY_VISITS`.
    * Each of its entries is `null` or an array of two numbers.
    * Member `MEMBER_FIRST_TRAFFIC_DAY_OFFSET` is `null`, or a number for which `Number.isInteger()` is `true`. When it is a number, member `MEMBER_FIRST_DATE` passes `isValidDateString()`.
  * Add a third parameter to `decodeDailyTraffic()`, `expectedRanges: ( [ number, number ] | null )[]`. Give each row the first number of its entry as `expectedMin` and the second as `expectedMax`, unchanged, or `null` for both when the entry is `null`.
  * Add a private `decodeFirstTrafficDate( firstDate: string, dayOffset: number | null ): string | null`. It returns `null` when `dayOffset` is `null`, and `addDays( firstDate, dayOffset )` otherwise, with `addDays()` from `assets/js/util/dates.ts`.
  * In `decodeBenchmarkingResponse()`, pass member `MEMBER_DAILY_EXPECTED_RANGES` to `decodeDailyTraffic()`, and return `firstTrafficDate` from `decodeFirstTrafficDate()`.

* [ ] In `assets/js/modules/analytics-4/datastore/__fixtures__/benchmarking-data.json`:
  * Add member `7`: `[ null, [ 118.4, 183.1 ], [ 124.3, 191.5 ], [ 117.9, 182.6 ] ]`, one entry for each of the four daily counts in the fixture. The first day has no band, and the other three have one.
  * Add member `8`: `-26`. It decodes to `2025-07-23`, 26 days before the fixture's first plotted day, `2025-08-18`. That is the one first day that leaves `2025-08-18` without a band and gives `2025-08-19` one.

Drawing the bounds on the chart is #13800. Reading `firstTrafficDate` in the panel is #13602.

### Test Coverage

* In `tests/phpunit/integration/Modules/Analytics_4/Benchmarking/Report_OptionsTest.php`:
  * Change the `get_daily_series_options()` tests from #13600 to expect the report to start 364 days before the period's first day: on `2025-08-20` for `2026-08-19` to `2026-09-15`, on `2025-09-10` for the 7 days ending on `2026-09-15`, and on `2025-06-19` for the 90 days ending on `2026-09-15`.
* In `tests/phpunit/integration/Modules/Analytics_4/Benchmarking/Response_BuilderTest.php`, on requests for `2026-08-19` to `2026-09-15`:
  * The daily report asks for `2025-08-20` to `2026-09-15`.
  * With `100` visits on every day from `2025-08-20` to `2026-09-15`, all 28 `dailyTraffic` rows have the bounds `77.6` to `122.4`.
  * With a daily pattern that changes from day to day, each row's bounds are the bounds that `Expected_Baseline::get_fit()` returns for the same day of the same daily report.
  * With `100` visits on every day from `2025-08-20` to `2026-08-18` and none after that, `dailyTraffic` still starts on `2026-08-19`, its rows have `0` visits and both bounds, and no day before `2026-08-19` is in the response.
  * With visits only from `2026-08-01` on, every row before `2026-08-28` has `null` for both bounds, and every row from `2026-08-28` on has a number for both.
  * Two builds whose daily rows differ only on `2026-09-15` return the same bounds on every earlier row.
  * `firstTrafficDate` is `2026-08-01` with visits from `2026-08-01` on, `2025-08-20` with visits on every day, `2026-08-01` with visits on `2026-08-01` only, and `null` with no visits.
  * Update `test_build__lists_0_visits_for_a_day_analytics_returned_no_row_for` to expect `expectedMin` and `expectedMax` as `null` on its three rows.
  * Make `test_build__does_not_return_a_number_with_decimals` skip the `expectedMin` and `expectedMax` of each `dailyTraffic` row, and assert instead that each of them is `null` or is equal to itself rounded to one decimal.
* In `tests/phpunit/integration/Modules/Analytics_4/Benchmarking/Response_EncoderTest.php`:
  * Add the bounds of the fixture's member `7` to the four rows of `get_fixture_response()`, and `firstTrafficDate` `2025-07-23`, so that the encoded response still matches the checked-in file.
  * Member `7` has one entry for each daily count, in the same order. A row whose bounds are `null`, or a row with no bounds, is encoded as `null`.
  * The bounds `118.44` and `183.16` are encoded as `118.4` and `183.2`.
  * Member `8` is `-18`, `0` and `5` for a `firstTrafficDate` 18 days before, on, and 5 days after the first plotted day, and `null` for a `firstTrafficDate` of `null`, for a response with no `firstTrafficDate`, and for an empty `dailyTraffic`.
  * An empty `dailyTraffic` gives an empty member `7`, and the encoded response has nine members.
* In `tests/phpunit/integration/Modules/Analytics_4/Datapoints/Get_Benchmarking_DataTest.php`:
  * In `test_rest_endpoint__answers_with_the_encoded_response`, give the two `dailyTraffic` rows bounds and the response a `firstTrafficDate`, and assert that member `7` carries the bounds and member `8` the offset.
* In `assets/js/modules/analytics-4/utils/benchmarking/decodeBenchmarkingResponse.test.ts`:
  * The checked-in fixture decodes to four rows with the bounds of member `7`, unchanged, and with `null` for both bounds on the first row, and to a `firstTrafficDate` of `2025-07-23`.
  * A member `8` of `null` decodes to a `firstTrafficDate` of `null`, and `0` and `5` decode to the first plotted day and the day 5 days after it.
  * A member `8` that moves the date across a daylight saving change decodes to the right day, with the test's time zone set to one whose clocks change.
  * Each of these decodes to `null`: an envelope of eight or of ten members, a member `7` that is not a list, a member `7` with one entry more or one entry fewer than the daily counts, an entry that is neither `null` nor two numbers, and a member `8` of `1.5`, `'-18'` or `[]`.
  * Add a member `7` with one `null` entry for each daily count, and a member `8` of `null`, to every encoded response written out in the file, including the 395-day one. Change "seven members" to "nine members" in the test names.
* In `assets/js/modules/analytics-4/datastore/benchmarking.test.ts`:
  * Add members `7` and `8` to every response body written out in the file, and `expectedMin`, `expectedMax` and `firstTrafficDate` to every decoded response the file expects. In the test that returns the decoded fields, give at least one day a pair and the response a first day, and expect them.
  * A response whose member `7` has fewer entries than member `3` stores the `benchmarking_decode_failed` error.
* In `assets/js/modules/analytics-4/datastore/__factories__/benchmarking.test.ts`:
  * Add `expectedMin: null` and `expectedMax: null` to the `dailyTraffic` rows written out in the file, and `firstTrafficDate` to the responses.
* In `assets/js/modules/analytics-4/components/traffic-overview/test-utils.ts` (added in #13600), give each row that `createDailyTrafficRows()` returns `expectedMin: null` and `expectedMax: null`. Add `firstTrafficDate` to every decoded response written out in the tests and stories under `assets/js/modules/analytics-4/components/traffic-overview/`, so that they still typecheck.
* No Storybook story is required, because no component renders the bounds or the first day until #13800 and #13602.
* No VRT changes expected.

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
