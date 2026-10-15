# `Expected_Baseline` — the expected range of daily visitors, fitted in PHP

## Feature Description

The Typical Traffic chart shows thirteen months of a site's daily visitors, but nothing tells the reader whether a given day was normal for that site. A site owner who sees a 12% dip cannot tell a normal January from a real problem. The chart's design answers this with an expected range: a band under the line that shows how many visitors the site's own history makes normal for each day. Nothing in the plugin computes that range today.

This issue adds `Expected_Baseline`, a PHP class in `includes/Modules/Analytics_4/Benchmarking/` that takes a site's daily visitor series and returns, for one day, the lowest and the highest number of visitors that is normal for that day. The class stores nothing and calls nothing. It is arithmetic over the series it is given, so it can be tested on its own with fixed series. The benchmarking response assembled in #13595 and the chart from #13600 will use its results, and changing them is separate work.

**Each day is judged only by the days before it, and by the day itself.** The fit for a day reads at most the 365 days that end on that day, and never a day after it. A spike in March therefore changes the band under March and under the days after March, but never the band under February. A band drawn under a day in the past is what the history up to that day expected, not what we know now. A day needs at least 28 days of history to have a band at all; a day with less has no band.

**The history starts on the first day with any traffic.** The daily series has a zero for every day without visitors, which is correct for the line. It is wrong for the fit when the zeros are days before the Analytics property existed, or before the site was tagged. Over a year of such zeros, the fit would clamp every real day to 25 visitors for months. So the fit drops the zeros at the start of the series and begins at the first day with recorded traffic. Zeros after that day stay in, because they are real days without visitors.

**How the band is built.** Each fit computes three values from its window:

- **A center**, the site's current level as a 28-day total. First, very high and very low days are limited to two and a half interquartile ranges beyond the quartiles, so one viral day or one day of broken tracking does not move the fit. The center is the end point of a straight line through the last 28 limited days, kept between 0.6 and 1.2 times their average. This lets the band follow a site that is really growing or shrinking, without jumping after one strange week.
- **A margin**, how far a normal 28 days strays from the center. It comes from how much the last 28 days varied around their weekday pattern. It has a lower limit that grows with the square root of the center, so a small site's band stays wide enough to hold its normal noise. It has an upper limit of 24% of the center, so one unsettled month does not make every later day look normal.
- **A weekday shape**, how each day of the week compares with the average day, so a site that is quiet at weekends gets a lower band at weekends.

The day's band is the center minus and plus the margin, spread over 28 days and multiplied by the factor for that day's weekday, rounded to one decimal. Because the lower limit of the margin grows with the square root of the center, the band is relatively wider on a small site: about 43% either side of the expectation at 10 visitors a day, about 32% at 25, and between 14% and 24% on large sites.

**A window too short for a trend gets a simpler fit.** The fit also measures the site's monthly trend from 28-day totals taken every 14 days. The band does not use the trend. The class reports it because two other things read it from the same fit: the week ahead, which continues the band for the seven days after the selected period along that trend, and the Traffic Insights epic. When a window has fewer than two 28-day totals, there is no trend: the center is the plain sum of the last 28 days, the margin is wider, and the trend is reported as stable.

**The arithmetic is fixed, so the result is exact.** The quartiles are positions in the sorted window rather than interpolated values, every sum runs from the oldest day to the newest, and rounding is PHP's default `round()`. A sum in another order can move a bound across a rounding boundary, so the tests assert every bound to the decimal.

Link to the design doc: https://docs.google.com/document/d/1dsEs6-NjlP_LNqz5md5fnJMuxh9Vd9f88w4DTrZdLok/edit?tab=t.y7e2u5h52vf1

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* `Expected_Baseline`, in `includes/Modules/Analytics_4/Benchmarking/`, takes a daily visitor series with each day's date, oldest first, and returns the fit for any day in it: that day's `expectedMin` and `expectedMax`, the monthly trend as a percentage, and the trend direction `UP`, `DOWN` or `STABLE`.
* The fit for a day reads the series from its first day with more than `0` visitors up to and including that day, and only the last 365 of those days:
  * A day with fewer than 28 such days has no fit, and its `expectedMin` and `expectedMax` are `null`.
  * A day with 28 or more has a fit, and both bounds are numbers rounded to one decimal.
* The fit is computed with these steps and constants, where `W` is the window of `n` days the fit reads:
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
* Every sum runs over its days from the oldest to the newest, and rounding is half away from zero.
* A series of 365 days at `100` visitors each gives the last day `expectedMin` `77.6` and `expectedMax` `122.4`, and a series of 365 days at `10` visitors each gives it `5.7` and `14.3`.
* A series of exactly 28 days at `100` visitors each gives the last day `expectedMin` `69.7` and `expectedMax` `130.3` and a `STABLE` direction, and a series of 27 such days gives it `null` for both.
* Adding 100 days of `0` visitors before a series of 365 days at `100` leaves the last day's bounds at `77.6` and `122.4`, and the first day with a band is the 28th day with visitors.
* A series whose every day has `0` visitors gives `null` bounds on every day.
* A series of 365 days at `100` visitors with one day of `5,000` in the middle gives every day the same bounds it would get if that day had `125` visitors.
* Changing the visitors on the last day of a series changes no bound on any earlier day.
* On a series with more visitors on weekdays than at weekends, every weekday's bounds are higher than every weekend day's bounds in the same week.
* The same series always produces the same bounds, trend and direction, to the decimal.
* `Expected_Baseline` makes no request, reads no option and writes nothing.

## Implementation Brief

* [ ] In `includes/Modules/Analytics_4/Benchmarking/Expected_Baseline.php` (new file):
  * Add the class `Expected_Baseline`, following `Row_Scorer` in the same directory for the file header, the docblocks and the constants. The constructor takes the daily series and nothing else: no `Context`, no `Options`, no module instance and no service client.
  * Add these class constants, and use them wherever the steps in the acceptance criteria use their values:
    * `MINIMUM_HISTORY_DAYS`, set to `28`: the fewest days of history a day needs to have a fit.
    * `MAXIMUM_HISTORY_DAYS`, set to `365`: the most days a fit reads.
    * `PERIOD_DAYS`, set to `28`: the days in each 28-day total, which are also the days the center and the margin read.
    * `PERIOD_STEP_DAYS`, set to `14`: the distance between the first days of two 28-day totals.
    * `DAYS_PER_MONTH`, set to `30.4375`.
    * `TREND_THRESHOLD_PERCENT`, set to `4`.
    * `DIRECTION_UP`, `DIRECTION_DOWN` and `DIRECTION_STABLE`, set to `'UP'`, `'DOWN'` and `'STABLE'`.
    * The coefficients of the formulas (`2.5`, `0.18`, `0.13`, `0.24` and the others) can stay inline, as `Row_Scorer::score_row()` keeps `0.6` and `0.4` inline.
  * `__construct( array $daily_traffic )`:
    * `$daily_traffic` is a list of days, oldest first, each `array( 'date' => 'YYYY-MM-DD', 'visitors' => int )`, with one entry for every day and no day missing. This is the shape `Response_Builder::get_daily_traffic()` returns.
    * Store each day's visitors, and each day's weekday as `(int) ( new DateTimeImmutable( $date, new DateTimeZone( 'UTC' ) ) )->format( 'w' )`, which is `0` for Sunday to `6` for Saturday.
    * Store the position of the first day with more than `0` visitors, or `null` when no day has visitors.
  * `get_fit( $day_index )`, public. `$day_index` is the zero-based position of the day in the series. It returns an array with four keys:
    * `expectedMin` and `expectedMax`: the day's bounds from the Band step, as floats.
    * `monthlyTrendPercent`: the monthly trend from the Trend step, as a float. It is not rounded.
    * `trendDirection`: `DIRECTION_UP` when the trend is above `TREND_THRESHOLD_PERCENT`, `DIRECTION_DOWN` when it is below `-TREND_THRESHOLD_PERCENT`, and `DIRECTION_STABLE` otherwise.
    * All four keys are `null` when the day has no fit. A day has no fit when no day in the series has visitors, when the day comes before the first day with visitors, or when fewer than `MINIMUM_HISTORY_DAYS` days run from the first day with visitors up to and including the day.
  * `fit_day( $day_index )`, private. It computes the fit and returns `null` when the day has no fit. Otherwise it returns `center` (`B`), `margin` (`M`), `weekdayFactors` (the seven values of `S`, keyed by weekday `0` to `6`) and `monthlyTrendPercent`. `get_fit()` builds its result from this array, and #13841 builds the week ahead from it too.
    * The window `W` starts at the later of two positions: the first day with visitors, and `$day_index - MAXIMUM_HISTORY_DAYS + 1`. It ends at `$day_index`.
    * It runs the steps of the acceptance criteria in order, one private method for each step, as listed below.
  * Rules that apply to every step, so that the bounds are the same to the decimal on every run:
    * Keep every list oldest first, and add it up in that order, with a `foreach` loop or with `array_sum()`.
    * Write each formula with its terms in the order the acceptance criteria give them, evaluated left to right. For example, `MAX( 0, B - M ) / 28 * S( d )` divides by `28` first and multiplies by `S( d )` after that.
    * Round only in the Band step, with `round( $value, 1 )`.
  * The private methods for the steps:
    * `limit_values( array $values )`: sort a copy of the window's values with `sort()`. Read `Q1` at position `intdiv( $count, 4 )` and `Q3` at position `intdiv( 3 * $count, 4 )` of the sorted copy, where `$count` is the number of days in the window. Return the window's values in their original order, each limited as the Limit step says and cast to `float`. The cast makes every later sum a float, so two sums can be compared with `!==`.
    * `get_period_totals( array $limited_values )`: add up the 28-day totals that start at positions `0`, `PERIOD_STEP_DAYS`, `2 * PERIOD_STEP_DAYS` and so on, while the total still ends inside the window. Then add up the last `PERIOD_DAYS` limited values, and append that sum only when it is `!==` the last total in the list. Compare the two sums by value, not by their positions.
    * `get_weekday_factors( array $limited_values, array $weekdays )`: take the mean of each weekday from `0` to `6` over the window. A window of 28 days or more holds every weekday at least four times. Add the seven means in the order of weekday `0` to `6`, and divide by `7` for `mean_all`.
    * `get_monthly_trend_percent( array $period_totals )`: a weighted least squares line through the totals, in closed form:
      * For each total `y` at index `k`, from `0` to `K - 1`, `x = k * PERIOD_STEP_DAYS / DAYS_PER_MONTH` and `w = exp( -0.18 * ( K - 1 - k ) )`.
      * Add up `w`, `w * x`, `w * y`, `w * x * x` and `w * x * y` over the totals.
      * `denominator = sum( w ) * sum( w * x * x ) - sum( w * x ) * sum( w * x )`, `slope = ( sum( w ) * sum( w * x * y ) - sum( w * x ) * sum( w * y ) ) / denominator`, and `weighted_mean = sum( w * y ) / sum( w )`.
      * Return `slope / weighted_mean * 100`, or `0` when `denominator` is `0` or `weighted_mean` is `0` or less.
    * `get_center( array $last_period_values )`: an ordinary least squares line through the last `PERIOD_DAYS` limited values, with `x` from `0` to `27`, in closed form:
      * `slope = ( 28 * sum( x * y ) - sum( x ) * sum( y ) ) / ( 28 * sum( x * x ) - sum( x ) * sum( x ) )` and `intercept = ( sum( y ) - slope * sum( x ) ) / 28`.
      * The line's value on the last day is `intercept + slope * 27`. Limit it as the Center step says, with `sum( y ) / 28` as the mean, and return `B`.
    * `get_margin( $center, array $last_period_values, array $last_period_weekdays, array $weekday_factors )`: return `M` from the Margin step.
    * `get_band( $center, $margin, $weekday_factor )`: return `expectedMin` and `expectedMax` from the Band step. #13841 calls it with the center of a day in the week ahead.
  * When there are fewer than two 28-day totals, `fit_day()` does not call `get_monthly_trend_percent()`, `get_center()` or `get_margin()`. It takes `B`, `M` and a monthly trend of `0` from the Short history step instead. `B` is the sum of the visitors of the last `PERIOD_DAYS` days of the window, before limiting. The weekday factors still come from `get_weekday_factors()`.

Calling `Expected_Baseline` from `Response_Builder`, the longer daily report and the bounds in the wire format are #13799. The week ahead is #13841. Drawing the band on the chart is #13800.

### Test Coverage

* Add `tests/phpunit/integration/Modules/Analytics_4/Benchmarking/Expected_BaselineTest.php`, following `Row_ScorerTest`, with a private helper that turns a list of visitor counts and a first date into a daily series. Assert every bound with `assertSame()`, and the trend with `assertEqualsWithDelta()`, because the trend is not rounded. Cover:
  * 365 days at `100` visitors give the last day `77.6` to `122.4` and `STABLE`. 365 days at `10` give `5.7` to `14.3`.
  * 28 days at `100` give the last day `69.7` to `130.3`, a trend of `0` and `STABLE`. 27 days at `100` give the last day `null` in all four keys.
  * 100 days at `0` followed by 365 days at `100` give the last day `77.6` to `122.4`. The 27th day with visitors has no fit, and the 28th day has `69.7` to `130.3`.
  * A series of only zeros gives every day `null` in all four keys.
  * 35 days at `1000` followed by 365 days at `100` give the last day `77.6` to `122.4`, because the fit reads only the last 365 days.
  * 365 days at `100` with one day of `5000` in the middle give every day the same result as the same series with `125` on that day. The same series with one day of `0` gives every day the same result as with `75` on that day.
  * Two series that differ only on their last day give the same result on every earlier day.
  * On 365 days with `120` visitors on every weekday and `50` on every Saturday and Sunday, both bounds of every weekday in the last week are higher than both bounds of every weekend day in that week.
  * 365 days rising by one visitor a day, from `100` to `464`, give the last day a trend above `4` and `UP`. The same days falling from `464` to `100` give a trend below `-4` and `DOWN`.
  * Two instances built from the same series return identical results for every day, trend and direction included.
  * The tests build `Expected_Baseline` from a series alone, with no `Context`, no options and no HTTP mocks.
* No Storybook story is required, because the change adds no UI.
* No VRT changes expected.

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
