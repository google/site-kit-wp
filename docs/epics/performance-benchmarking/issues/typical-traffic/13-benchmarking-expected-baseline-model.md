# `Expected_Baseline` — calculate the normal range of daily visits from a site's history, for the Typical Traffic chart

## Feature Description

The Typical Traffic chart is going to show an expected range, shown below as the light purple background behind the thick line in the chart. The range is based on, for each day: the lowest and the highest number of visits that are normal for the site on that day. A site owner can then see whether a dip is normal for their site or a real problem.

<img width="868" height="230" alt="Image" src="https://github.com/user-attachments/assets/1302fa79-d6b6-4155-9538-a8af20990030" />

This issue adds the calculation of that range: `Expected_Baseline`, a PHP class that takes a site's daily visits and returns the range for any day, with the site's monthly trend for Traffic Insights. A day's range reads only that day and up to 364 days before it, follows the site's recent level and weekday pattern, and is not moved by one unusual day. Nothing calls the class yet: #13799 adds its range to the response, and #13800 draws it.

Link to the design doc: https://docs.google.com/document/d/1dsEs6-NjlP_LNqz5md5fnJMuxh9Vd9f88w4DTrZdLok/edit?tab=t.y7e2u5h52vf1 (see "Expected range" and "Expected range model")

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* `Expected_Baseline`, in `includes/Modules/Analytics_4/Benchmarking/`, takes a daily series of visits, oldest first with one entry for each day, and returns for any day in it: `expectedMin`, `expectedMax`, the monthly trend as a percentage, and the trend direction `UP`, `DOWN` or `STABLE`.
* A day has a range only when at least 28 days run from the first day with more than `0` visits up to and including that day. Otherwise, its `expectedMin` and `expectedMax` are `null`. Bounds that are not `null` are rounded to one decimal.
* These series give these results:
  | Daily series | Result |
  | :---- | :---- |
  | 365 days at `100` | The last day has `77.6` to `122.4` and `STABLE`. |
  | 365 days at `10` | The last day has `5.7` to `14.3`. |
  | 28 days at `100` | The last day has `69.7` to `130.3` and `STABLE`. |
  | 27 days at `100` | The last day has `null` bounds. |
  | 100 days at `0`, then 365 days at `100` | The 27th day with visits has `null` bounds, the 28th has `69.7` to `130.3`, and the last day has `77.6` to `122.4`. |
  | 35 days at `1000`, then 365 days at `100` | The last day has `77.6` to `122.4`. |
  | 365 days rising by one visit a day, from `100` to `464` | The last day has `UP`. |
  | 365 days falling by one visit a day, from `464` to `100` | The last day has `DOWN`. |
  | Only days with `0` visits | Every day has `null` bounds. |
* 365 days at `100` with one day of `5000` in the middle give every day the same results as the same series with `125` on that day. With one day of `0` instead, they give the same results as with `75` on that day.
* Changing the visits on the last day of a series changes no result on any earlier day.
* On 365 days with `120` visits on every weekday and `50` on every Saturday and Sunday, both bounds of every weekday in the last week are higher than both bounds of every weekend day in that week.

## Implementation Brief

* [ ] Add `includes/Modules/Analytics_4/Benchmarking/Expected_Baseline.php`, following `Row_Scorer` for the file header, the docblocks and the constants:
  * The constructor takes only the daily series: a list of `array( 'date' => 'YYYY-MM-DD', 'visits' => int )`, oldest first, which is the shape of the daily series `Response_Builder::get_daily_series()` builds after #13600 and #13844.
  * Add the constants `MINIMUM_HISTORY_DAYS` (`28`), `MAXIMUM_HISTORY_DAYS` (`365`, which #13799 uses), and `DIRECTION_UP`, `DIRECTION_DOWN` and `DIRECTION_STABLE`. The other numbers in the formulas can stay inline, as in `Row_Scorer::score_row()`.
  * Add `get_fit( $day_index )`, where `$day_index` is the day's zero-based position in the series. It returns `expectedMin`, `expectedMax`, `monthlyTrendPercent` (not rounded) and `trendDirection`, all `null` when the day has no range.
  * Compute the fit in a private method that returns `B`, `M`, the seven weekday factors and the monthly trend, and build the band in a separate private method.
  * The fit for a day reads the window `W` of `n` days: from the later of the first day with visits and the day 364 days earlier, up to and including the day. When `n` is less than `MINIMUM_HISTORY_DAYS`, or the series has no day with visits up to that day, the day has no range. Otherwise the fit computes:
    | Step | Computation |
    | :---- | :---- |
    | Limit | Sort `W`. `Q1` and `Q3` are the values at zero-based positions `FLOOR( n / 4 )` and `FLOOR( 3 * n / 4 )`, and `IQR = MAX( 10, Q3 - Q1 )`. Every value in `W` is limited to `[ MAX( 0, Q1 - 2.5 * IQR ), Q3 + 2.5 * IQR ]`. |
    | 28-day totals | The limited sums over positions `[ 0, 28 )`, `[ 14, 42 )`, `[ 28, 56 )` and so on while `W` lasts, then the limited sum of the last 28 days unless the last total already equals it. `K` is how many totals there are. |
    | Weekday shape | `S( d ) = 0.10 + 0.90 * mean( d ) / mean_all`, where `mean( d )` is weekday `d`'s mean over the limited `W` and `mean_all` is the mean of the seven; a `mean_all` of `0` or less is read as `1`. |
    | Trend | Weighted least squares over the 28-day totals against `x_k = k * 14 / 30.4375` months, with weights `EXP( -0.18 * ( K - 1 - k ) )`. The monthly trend is the fitted slope over the weighted mean of the totals, as a percentage, and `0` when the fit's denominator is `0` or the weighted mean is not above `0`. The direction is `UP` above `+4%`, `DOWN` below `-4%`, and `STABLE` otherwise. |
    | Center | Ordinary least squares through the last 28 limited days; its value on the last of them, kept within `[ 0.6, 1.2 ]` times their mean; `B = MAX( 10, 28 * that value )`. |
    | Margin | `RMSE = SQRT( SUM( ( v - B / 28 * S( d ) )^2 ) / 21 ) * SQRT( 28 )` over the last 28 limited days `v`, each with its weekday `d`. `floor = 5 * SQRT( B ) + 0.13 * B`, `ceiling = MAX( floor, 0.24 * B )`, and `M = MAX( 15, floor, MIN( ceiling, 2.5 * RMSE ) )`. |
    | Short history | When `K < 2`: `B` is the sum of the last 28 days before limiting, `M = MAX( 15, 0.18 * B + 6.5 * SQRT( B ), 0.25 * B )`, the monthly trend is `0` and the direction is `STABLE`. |
    | Band | `expectedMin = ROUND( MAX( 0, B - M ) / 28 * S( d ), 1 )` and `expectedMax = ROUND( ( B + M ) / 28 * S( d ), 1 )`, with `d` the weekday of the day being fitted. |
  * Take each day's weekday from its date in UTC, `0` for Sunday to `6` for Saturday. Add up every list from the oldest day to the newest, write each formula with its terms in the order the table gives them, and round only in the Band step, with `round( $value, 1 )`. The tests assert the bounds to the decimal, and another order can change the last decimal.

### Test Coverage

* Add `tests/phpunit/integration/Modules/Analytics_4/Benchmarking/Expected_BaselineTest.php`, following `Row_ScorerTest`, with a test for each example in the acceptance criteria. Assert the bounds with `assertSame()`, and the trend with `assertEqualsWithDelta()` because it is not rounded. Build the class from a series alone, with no `Context`, no options and no HTTP mocks.
* No Storybook story is required, because the change adds no UI.
* No VRT changes expected.

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
