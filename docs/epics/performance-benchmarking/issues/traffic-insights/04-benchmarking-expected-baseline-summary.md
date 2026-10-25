# `Expected_Baseline` — the 28-day range, history length and seasonality for the insight request

GitHub issue: [#13941](https://github.com/google/site-kit-wp/issues/13941)

## Feature Description

`Expected_Baseline` (#13798) calculates the normal range of daily visits for each day. The insight request needs a summary of the same calculation for `endDate`. With it, the generated text can compare the 28 days with the site's usual range, such as "your usual range over the past 6 months". The summary can also change which scenario the service picks for the period.

This issue adds this summary as a method next to the calculation. It returns the `baseline` fields that the service expects: the length of the history in months, the expected range for a 28-day total, the trend direction, and whether the period looks seasonal. The method needs only the daily series. Nothing calls it yet: the payload (#13943) sends it to the service.

Link to the design doc: https://docs.google.com/document/d/1dsEs6-NjlP_LNqz5md5fnJMuxh9Vd9f88w4DTrZdLok/edit?pli=1&tab=t.ti7yrmnh2lrv#heading=h.xai0p0vhie15 (see "Expected baseline" and "What the service is told")

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* For a daily series of visits and an end date, the summary returns `period_months`, `expected_range_min`, `expected_range_max`, `trend_direction` and `is_seasonal_period`, read from the `Expected_Baseline` calculation for the end date.
* `period_months` is the length of the calculation's history in whole months, and at least `1`: `2` for 56 days of history, and `12` for 365 days or more.
* `expected_range_min` and `expected_range_max` are the expected range for a 28-day total, as integers, and never below `0`. 56 days at `100` visits a day and 365 days at `100` visits a day both give `2171` to `3429`.
* `trend_direction` is the calculation's trend direction: `UP` for 365 days that rise by one visit a day from `100` to `464`, `DOWN` for the same days in reverse order, and `STABLE` for 365 days at `100`.
* `is_seasonal_period` compares two changes: the change of the 28 days that end on the end date, compared with the 28 days before them, and the same change one calendar year earlier. It is `true` only when both changes are at least 10% in the same direction, they are no more than `MAX( 15, 1.5 × ABS( last year's change ) )` points apart, and this year's change is under 100%:

  | This year's change | Last year's change | `is_seasonal_period` |
  | :---- | :---- | :---- |
  | `+20%` | `+18%` | `true` |
  | `-20%` | `-18%` | `true` |
  | `+20%` | `+8%` | `false` |
  | `+20%` | `-18%` | `false` |
  | `+24%` | `+10%` | `true` |
  | `+26%` | `+10%` | `false` |
  | `+120%` | `+100%` | `false` |

* `is_seasonal_period` is `false` when the 28 days before either window start before the first day with visits, or have no visits. So a site with less than about 14 months of recorded traffic always gets `false`.

## Implementation Brief

* [ ] <!-- One or more bullet points for how to technically implement the feature. Make sure to include changes to Storybook and visual regression tests where relevant. -->

### Test Coverage

* <!-- One or more bullet points for how to implement automated tests to verify the feature works. -->

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
