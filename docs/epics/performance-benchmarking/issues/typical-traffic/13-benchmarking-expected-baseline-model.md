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

**A window too short for a trend gets a simpler fit.** The fit also measures the site's monthly trend from 28-day totals taken every 14 days. The band does not use the trend, but the Traffic Insights epic reads it from the same fit, so the class reports it. When a window has fewer than two 28-day totals, there is no trend: the center is the plain sum of the last 28 days, the margin is wider, and the trend is reported as stable.

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

* [ ] <!-- One or more bullet points for how to technically implement the feature. Make sure to include changes to Storybook and visual regression tests where relevant. -->

### Test Coverage

* <!-- One or more bullet points for how to implement automated tests to verify the feature works. -->

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
