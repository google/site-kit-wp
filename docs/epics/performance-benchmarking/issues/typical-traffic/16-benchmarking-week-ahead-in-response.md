# Benchmarking response — the expected range for the seven days after `endDate`, in `forecast` and the wire format

## Feature Description

The design of the Typical Traffic chart continues the expected range for seven days after the last day of the selected date range, past a divider, so the days just ahead have a shape rather than being blank ([Figma](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=1747-32704&m=dev)). Nothing computes those seven days today. `Expected_Baseline` from #13798 fits each day on the history up to and including that day, so it has nothing to say about a day that has not happened yet. The benchmarking response from #13799 carries bounds only for the 395 plotted days in `dailyTraffic`, and the wire format has no member for a day after `endDate`.

This issue adds the week ahead to the response: a `forecast` field with one row for each of the seven days after `endDate`, each carrying `expectedMin` and `expectedMax`, computed on the server and carried to the browser in a new member of the wire format.

**The week ahead is the fit for `endDate`, carried forward.** The server already fits `endDate` for the band under the last plotted day. Each forward day's band is that same fit, moved along the site's monthly trend that the fit measures, and spread onto the day with the factor for its day of the week. It is arithmetic over a fit the server already has, not a call to a model. It needs no new report and no new request.

**Only the trend moves the band.** The margin stays the margin of the fit for `endDate`, so the band does not get wider for the days further ahead. A horizon of seven days is short enough for that. A growing site's week ahead rises, and a shrinking site's week ahead falls. The center never goes below zero, so a steep decline never produces a negative visitor count.

For a request ending on `2026-09-15`, on a site with 100 visitors on every one of the last 365 days, the fit for `2026-09-15` has a center of `2800` visitors over 28 days, a margin of `628.6` and no trend. Every forward day keeps the band of `2026-09-15`:

```json
"forecast": [
	{ "date": "2026-09-16", "expectedMin": 77.6, "expectedMax": 122.4 },
	{ "date": "2026-09-17", "expectedMin": 77.6, "expectedMax": 122.4 },
	...
	{ "date": "2026-09-22", "expectedMin": 77.6, "expectedMax": 122.4 }
]
```

Had the same fit measured a monthly trend of `+10%`, the center would grow by `10% * h / 30.4375` on the day `h` days after `2026-09-15` and the margin would stay, so the band on `2026-09-16` would be `77.9` to `122.8`, and the band on `2026-09-22` would be `79.9` to `124.7`.

**The week is seven days for every date range.** It describes where the site is heading now, not the selected period, so it is the same seven days whether the reader selected 7 or 90 days. The projection counts its days from `endDate` and does not read the current date, so the same series and the same `endDate` always give the same seven rows, and the tests can assert them to the decimal.

**`forecast` is its own field rather than seven more rows on `dailyTraffic`.** Everything that reads `dailyTraffic` reads days that happened: the line, the period totals and the band. A row with no visitor count would have to be skipped by each of them. A separate field also keeps the week the same length while the window before it changes.

**No band on `endDate` means no week ahead.** When the site has fewer than 28 days of traffic history up to and including `endDate`, counted from its first day with any visitors, the row for `endDate` has no bounds. There is then no fit to carry forward, and the response carries no `forecast`.

**The wire format gains member `8`.** It holds one `[ expectedMin, expectedMax ]` pair for each of the seven days, in order, or an empty array when there is no week ahead. No dates travel: the browser dates the pairs from the last plotted day. The bounds are rounded to one decimal before they are encoded, as every other non-integer in the format is, and the browser does not round them again. The format version stays `1`, because no response in format `1` has been released to users. The example above travels as:

```json
[ [ 77.6, 122.4 ], [ 77.6, 122.4 ], [ 77.6, 122.4 ], [ 77.6, 122.4 ], [ 77.6, 122.4 ], [ 77.6, 122.4 ], [ 77.6, 122.4 ] ]
```

The checked-in fixture that both the PHP encoder test and the JavaScript decoder test read gains member `8`, so a change to the week ahead on one side without the other still fails one of the two tests.

This issue needs `Expected_Baseline` from #13798, and the bounds in the response and member `7` of the wire format from #13799. The `keyFactors` it leaves unchanged come from #13845. The decoded `forecast` reaches the panel from #13599 with the rest of the response, through the `benchmarking` slice from #13598. Drawing the week ahead on the chart is #13842.

Link to the design doc: https://docs.google.com/document/d/1dsEs6-NjlP_LNqz5md5fnJMuxh9Vd9f88w4DTrZdLok/edit?tab=t.y7e2u5h52vf1

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* For a request with `endDate=2026-09-15` whose `dailyTraffic` row for `2026-09-15` has bounds, the response carries `forecast`: seven rows dated `2026-09-16` to `2026-09-22`, in ascending date order, each `{ date, expectedMin, expectedMax }`.
* When the `dailyTraffic` row for `endDate` has `null` bounds, the response carries no `forecast`:
  * On a series with `0` visitors on every day before `2026-08-19` and visitors on every day from then on, a request ending on `2026-09-15` carries `forecast`.
  * On the same series with visitors only from `2026-08-20` on, the same request carries no `forecast`.
* The bounds of each forward day `endDate + h`, with `h` from `1` to `7`, come from the fit `Expected_Baseline` makes for `endDate`, carried forward:
  | Step | Computation |
  | :---- | :---- |
  | Center | `B * MAX( 0, 1 + slope / 100 * h / 30.4375 )`, where `B` is the center of the fit for `endDate` and `slope` is its monthly trend, in percent |
  | Margin | `M`, the margin of the fit for `endDate`, unchanged |
  | Band | `expectedMin = ROUND( MAX( 0, center - M ) / 28 * S( d ), 1 )` and `expectedMax = ROUND( ( center + M ) / 28 * S( d ), 1 )`, where `S` is the weekday shape of the fit for `endDate` and `d` is the weekday of `endDate + h` |
* Rounding is half away from zero, and every forward bound is a number with at most one decimal.
* A series of 365 days at `100` visitors each gives every forward day `expectedMin` `77.6` and `expectedMax` `122.4`, the same bounds as `endDate`.
* On a series of 365 days rising by one visitor a day, from `100` to `464`, both bounds on `endDate + 7` are higher than the bounds on `endDate`. On a series falling by one visitor a day, from `464` to `100`, both are lower.
* On a series of 365 days with `120` visitors on every weekday and `50` on every Saturday and Sunday, every forward weekday has higher bounds than every forward Saturday and Sunday.
* No forward bound is below `0`, and a forward day whose center would fall below `0` takes a center of `0`. On a series of 14 days at `1000` visitors followed by 28 days at `5`, ending on `endDate`, the bounds on `endDate + 7` are `0` and `2.8`.
* The same series and the same `endDate` give the same `forecast`, to the decimal, whatever day the request is made on.
* Producing `forecast` runs no report, and the response takes no more calls to Analytics than it does without `forecast`.
* `visitors`, `dailyTraffic` and `keyFactors` are the same as before, and `dailyTraffic` holds no row after `endDate`.
* The encoded response is an array of nine members. Members `0` to `7` are unchanged, and member `8` holds the week ahead:
  * Seven `[ expectedMin, expectedMax ]` pairs, one for each day from `endDate + 1` to `endDate + 7` in order, when the response carries `forecast`.
  * An empty array when it carries none.
* The format version in member `0` stays `1`.
* The decoder dates the first pair of member `8` the day after the last `dailyTraffic` row, and each later pair one day after the one before it, and returns them as `forecast` rows with the bounds unchanged. When member `8` is empty, the decoded response has no `forecast`.
* An encoded response that is not an array of nine members, or whose member `8` is neither empty nor seven pairs, decodes to nothing and is reported as an unusable response.
* The checked-in `benchmarking-data.json` carries member `8` with seven pairs. Encoding the fixed set of values in the PHP test produces that file, and decoding that file in the JavaScript test produces `forecast` rows with the matching dates and bounds.

## Implementation Brief

* [ ] In `includes/Modules/Analytics_4/Benchmarking/Expected_Baseline.php` (added in #13798):
  * Add `FORECAST_DAYS`, set to `7`.
  * Add `get_forecast()`. It returns the expected range for each of the `FORECAST_DAYS` days after the last day of the series the class holds, and it reads only the fit for that last day:
    * When the last day has no fit, return an empty array.
    * Get the center `B`, the margin `M`, the weekday shape `S` and the monthly trend of that fit from the same private method that fits a day for its bounds, so the fit has one implementation. If that method returns only the bounds, the trend and the direction, make it return `B`, `M` and `S` as well.
    * Compute each forward day's bounds with the Center, Margin and Band steps in the acceptance criteria. Build the band with the code that builds a fitted day's band, with the forward center in place of `B`. Move that code into its own private method if it is not one yet.
    * Read `S` for the weekday of the forward day, numbered the way the fit numbers weekdays. Take `30.4375` from the same constant the trend step uses.
    * Write each formula with its terms in the order the acceptance criteria give them, and round with `round( $value, 1 )`, so the bounds match the tests to the decimal.
    * Date the rows from the last date of the series. Start from a `DateTimeImmutable` in UTC and move one day forward with `modify( '+1 day' )` for each row, as `Response_Builder::get_daily_traffic()` does. Do not read the current time: no `time()`, no `current_time()`, and no `DateTimeImmutable` created without a date.
    * Return the rows oldest first, each as `array( 'date' => 'YYYY-MM-DD', 'expectedMin' => float, 'expectedMax' => float )`.

* [ ] In `includes/Modules/Analytics_4/Benchmarking/Response_Builder.php`:
  * In `build()`, call `get_forecast()` on the same `Expected_Baseline` instance that fits the `dailyTraffic` bounds (#13799). That instance holds the daily series that ends on `$end_date`, so the rows it returns start on the day after `$end_date`.
  * Add those rows to the returned array as `forecast`, right after `dailyTraffic`, only when `get_forecast()` returns rows. Add `forecast` to the `@return` description of `build()`.

* [ ] In `includes/Modules/Analytics_4/Benchmarking/Wire_Format.php`:
  * Add `MEMBER_FORECAST`, set to `8`, after the member `7` constant from #13799. Leave `FORMAT_VERSION` at `1`.

* [ ] In `includes/Modules/Analytics_4/Benchmarking/Response_Encoder.php`:
  * In `encode()`, write member `Wire_Format::MEMBER_FORECAST`: one `array( expectedMin, expectedMax )` for each `forecast` row, in the order the rows arrive. Encode each bound the way member `7` encodes the `dailyTraffic` bounds (#13799). Do not write the rows' dates.
  * When the response has no `forecast`, write an empty array for that member.
  * Add `forecast` to the `@param` description of `encode()`.

* [ ] In `assets/js/modules/analytics-4/utils/benchmarking/constants.ts`:
  * Add `MEMBER_FORECAST`, set to `8`.
  * Add `BENCHMARKING_FORECAST_DAYS`, set to `7`: the number of pairs in a member `8` that is not empty. It matches `Expected_Baseline::FORECAST_DAYS`.

* [ ] In `assets/js/modules/analytics-4/utils/benchmarking/types.ts`:
  * Add `BenchmarkingForecastRow`: `{ date: string; expectedMin: number; expectedMax: number }`.
  * Add `forecast?: BenchmarkingForecastRow[]` to `DecodedBenchmarkingResponse`.

* [ ] In `assets/js/modules/analytics-4/utils/benchmarking/decodeBenchmarkingResponse.ts`:
  * Raise `MEMBER_COUNT` to `9`.
  * Add three checks to `membersHoldTheirShapes`, so a response that fails any of them decodes to `null`:
    * Member `MEMBER_FORECAST` is an array that is empty or holds exactly `BENCHMARKING_FORECAST_DAYS` entries.
    * Each of its entries is an array of two numbers.
    * When it is not empty, member `MEMBER_DAILY_VISITORS` is not empty either, because the pairs are dated from the last daily row.
  * Add `decodeForecast( lastDate: string, pairs: [ number, number ][] ): BenchmarkingForecastRow[]` next to `decodeDailyTraffic()`. Start from `stringToDate( lastDate )`, and before each pair move the date one day forward with `setDate( date.getDate() + 1 )`, as `decodeDailyTraffic()` does. Give each row the pair's first number as `expectedMin` and its second as `expectedMax`, unchanged.
  * In `decodeBenchmarkingResponse()`, when member `MEMBER_FORECAST` holds pairs, pass the date of the last decoded `dailyTraffic` row and the pairs to `decodeForecast()`, and add the result to the returned object as `forecast`. When the member is empty, leave the `forecast` key out.

* [ ] In `assets/js/modules/analytics-4/datastore/benchmarking.ts`:
  * Add `forecast` to the `@return` description of the `getBenchmarkingData()` selector.

* [ ] In `assets/js/modules/analytics-4/datastore/__fixtures__/benchmarking-data.json`:
  * Add member `8`: seven different `[ expectedMin, expectedMax ]` pairs, each bound with one decimal. They stand for `2025-08-22` to `2025-08-28`, the seven days after the fixture's last daily count.

#13799 adds the 759-day daily series, the `dailyTraffic` bounds and member `7`. Drawing `forecast` on the chart is #13842.

### Test Coverage

* In `tests/phpunit/integration/Modules/Analytics_4/Benchmarking/Expected_BaselineTest.php` (added in #13798), add cases for `get_forecast()`, on series that end on `2026-09-15` unless the case says otherwise:
  * 365 days at `100` visitors give seven rows, dated `2026-09-16` to `2026-09-22` in that order, each `77.6` to `122.4`.
  * On 365 days rising by one visitor a day, from `100` to `464`, both bounds of the seventh row are higher than the bounds of the last day. On the same days falling from `464` to `100`, both are lower.
  * On 365 days of `120` visitors on weekdays and `50` at weekends, every forward weekday has higher bounds than every forward Saturday and Sunday.
  * On 14 days at `1000` followed by 28 days at `5`, the seventh row is `0` to `2.8`, and no bound in any row is below `0`.
  * A series with `0` visitors before `2026-08-19` and `100` from then on gives seven rows, each `69.7` to `130.3`. With visitors from `2026-08-20` on, it gives an empty array, and so does a series of zeros.
  * 365 days at `100` visitors ending on `2024-02-27` give rows dated `2024-02-28`, `2024-02-29`, then `2024-03-01` to `2024-03-05`.
* In `tests/phpunit/integration/Modules/Analytics_4/Benchmarking/Response_BuilderTest.php`:
  * With daily rows on every day from `2026-08-19` to `2026-09-15`, `build( '2026-08-19', '2026-09-15' )` returns seven `forecast` rows dated `2026-09-16` to `2026-09-22`, and the last `dailyTraffic` row is `2026-09-15`.
  * With daily rows from `2026-08-20` on, the response has no `forecast` key.
  * A response with `forecast` takes the same batch calls as before.
  * Make `test_build__does_not_return_a_number_with_decimals` allow the `forecast` bounds, as it allows the `dailyTraffic` bounds after #13799.
* In `tests/phpunit/integration/Modules/Analytics_4/Benchmarking/Response_EncoderTest.php`:
  * Add seven `forecast` rows to `get_fixture_response()`, for `2025-08-22` to `2025-08-28`, with the bounds of the fixture's member `8`. The encoded response then has to match the checked-in file and still carry no date but the first.
  * A response without `forecast` is encoded as nine members, with an empty member `8`.
  * A forward bound with two decimals is encoded with one.
* In `assets/js/modules/analytics-4/utils/benchmarking/decodeBenchmarkingResponse.test.ts`:
  * The checked-in fixture decodes to seven `forecast` rows, dated `2025-08-22` to `2025-08-28`, with the bounds of member `8` unchanged.
  * An empty member `8` decodes to a response with no `forecast` key.
  * The pairs after a last daily row on `2026-09-28` are dated `2026-09-29` to `2026-10-05`.
  * Each of these decodes to `null`: an envelope of eight or ten members, a member `8` of six or eight pairs, a member `8` that is not a list, a pair that is not two numbers, and seven pairs with no daily counts.
  * Add an empty member `8` to every encoded response written out in the file.
* In `assets/js/modules/analytics-4/datastore/benchmarking.test.ts`:
  * Add an empty member `8` to every response body written out in the file.
  * A response whose member `8` holds six pairs stores the `benchmarking_decode_failed` error.
* No Storybook story is required, because nothing renders `forecast` until #13842.
* No VRT changes expected.

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
