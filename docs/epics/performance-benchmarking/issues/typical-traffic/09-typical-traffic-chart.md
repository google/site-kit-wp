# Typical Traffic chart — daily visits across the selected date range

## Feature Description

The Typical Traffic tab exists to answer one question the Traffic Overview tab cannot: is this period normal for this site? This issue adds the chart that question is answered on: a single line of daily visits — GA4 sessions — for each day of the selected date range.

**The chart plots the days the date-range selector picks, as the Traffic Overview chart does.** `Last 28 days` plots 28 days, and `Last 90 days` plots 90 days. The horizontal axis is labelled the same way as on the Traffic Overview chart. The year of history that tells the reader whether the period is normal is not drawn as a line. It is drawn later as a band under this line, the expected range: for each day, the number of visits the site's own last 12 months make normal for that day. #13800 adds the band.

**The benchmarking response returns the same days.** Today `GET:benchmarking-data` returns the 395 days that end on the last day of the selected range, whatever the range. This issue makes it return only the days of the selected range. The site's totals for the selected period and for the period before it are still added up from the daily report, which now covers exactly those two periods. The longest period the datapoint accepts becomes 90 days, the longest range the date-range selector offers, in place of 197 days.

**The line counts sessions, which the tab calls visits.** It is plotted from raw daily counts of sessions, the unit the key factor cards and the period totals count in. That is not the Traffic Overview chart's unit: that chart plots visitors, so the two charts show different numbers for the same day. Hovering a day therefore names its value `Visits`, where the Traffic Overview chart's hover says `Users`.

**The chart shows no property-creation marker.** The Traffic Overview chart marks the day the Analytics property was created when that day is inside the selected range. On this tab that day is never inside the range: the tab only appears for a property that is at least thirteen months old, and the range is at most 90 days long.

The chart is drawn entirely from the values its panel hands it and reads nothing from the data store itself, which is what lets it be rendered from a fixture. Those values come from the slice in #13598, and the panel that passes them down is #13599. The response's daily series moves from visitors to sessions in #13845, and #13844 renames the decoded `visitors` field to `visits`, together with this chart's reads of it; the chart draws whatever `dailyTraffic` carries.

Link to the design doc: https://docs.google.com/document/d/1dsEs6-NjlP_LNqz5md5fnJMuxh9Vd9f88w4DTrZdLok/edit?tab=t.y7e2u5h52vf1

<img width="1348" height="359" alt="Image" src="https://github.com/user-attachments/assets/814309a2-d883-451f-bcd5-46d2b0cf4eaa" />

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* On the Typical Traffic tab, the chart plots one point per day for each day of the selected date range, as a single line of daily visits: 28 points for `Last 28 days`, and 90 points for `Last 90 days`.
* Hovering over a day shows the day and its value, with the value labelled `Visits`.
* Changing the date range from `Last 28 days` to `Last 90 days` makes the chart plot the 90 days of the new range.
* A day with no visits is plotted as `0` rather than skipped, so the line has no break and every day occupies its own position on the axis.
* The horizontal axis labels days with the short date the Traffic Overview chart uses, such as `Sep 1`, over gridlines that are not drawn.
* The value axis spans `0` to the highest daily value in the selected range, or `0` to `100` when every day has `0` visits.
* The chart shows no `Google Analytics property created` marker.
* For a request with `startDate=2026-08-19` and `endDate=2026-09-15`, the benchmarking response's `dailyTraffic` holds one row for each of the 28 days from `2026-08-19` to `2026-09-15`, oldest first, and no other day.
* The response's two period totals are still the visits of the selected period and of the period before it: `2026-08-19` to `2026-09-15`, and `2026-07-22` to `2026-08-18`.
* `GET:benchmarking-data` answers a period of up to 90 days. It refuses a period of 91 days or more with a `400` error whose message names 90 days, and runs no report for it.
* The expected range, published posts, and the feedback element are out-of-scope for this issue.

## Implementation Brief

* [ ] In `includes/Modules/Analytics_4/Benchmarking/Report_Options.php`:
  * Replace `DAILY_SERIES_DAYS` with `MAXIMUM_PERIOD_DAYS`, set to `90`: the most days a period can have, which is the longest range the dashboard's date-range selector offers.
  * In `get_daily_series_options()`, start the report on the first day of `get_compare_range()`, in place of `DAILY_SERIES_DAYS - 1` days before `$end_date`, so the report covers the compare period and the selected period and nothing else. Update its docblock.

* [ ] In `includes/Modules/Analytics_4/Benchmarking/Response_Builder.php`:
  * Rename `get_daily_traffic()` to `get_daily_series()`, and add a third parameter, `$end_date`. Make it walk every day from `$first_date` to `$end_date`, in place of `Report_Options::DAILY_SERIES_DAYS` days. Each day is still `array( 'date' => 'YYYY-MM-DD', 'visitors' => int )`, with `0` for a day the report has no row for.
  * Add a private `get_daily_traffic( array $daily_series, $start_date )`. It returns the days of `$daily_series` from `$start_date` on, oldest first, with `array_slice()`, so the list keeps keys from `0`.
  * In `build()`:
    * Build the daily series with `get_daily_series()`, from the report's `startDate` to `$end_date`.
    * Sum both `visitors` totals with `sum_visitors()` over the daily series, because `dailyTraffic` no longer holds the compare period.
    * Return `get_daily_traffic()` of the daily series as `dailyTraffic`, and update its `@return` description: one day for each day of the selected period, oldest first.

* [ ] In `includes/Modules/Analytics_4/Datapoints/Get_Benchmarking_Data.php`:
  * In `create_request()`, refuse a period longer than `Report_Options::MAXIMUM_PERIOD_DAYS` days, in place of `intdiv( Report_Options::DAILY_SERIES_DAYS, 2 )`, with the same `invalid_param` error. Update the comment above the check, the `@return` description of the method, and the translators comment of the message, whose example is `197`.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/charts/getTypicalTrafficChartData.ts` (new file), following `getTrafficChartData.ts`:
  * Export `getTypicalTrafficChartData( { dailyTraffic }: { dailyTraffic: BenchmarkingDailyTrafficRow[] } ): TypicalTrafficChartData`, with the row type from `assets/js/modules/analytics-4/utils/benchmarking/types.ts`.
  * Return `chartData`, a `TrafficChartTable`: a `date` column labelled `Day`, as `getTrafficChartData()` builds it, and a `number` column labelled `Visits` rather than the `Users` that `getTrafficChartData()` uses, because this line counts sessions. Google Charts prints that label beside a day's value when the day is hovered. Then one `[ stringToDate( row.date ), row.visitors ]` point per row, in the order of the rows. A row with `visitors: 0` becomes a point at `0`. Never skip a row.
  * Return `ticks`: the date of every point except the first, as `getTrafficChartData()` returns them.
  * Return `maximumVisitors`, the highest `visitors` value in the rows.
  * Take the days only from the rows. Do not read the selected date range here.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/charts/TypicalTrafficChartHeader.tsx` (new file), following `MetricTileHeader`:
  * Render a `div` with the class `googlesitekit-traffic-overview__typical-traffic-chart-header`. Inside it, render the title and then an `InfoTooltip`, per the design: https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=1747-32707&m=dev
  * Render the title as a `Typography` with `as="h3"`, `type={ TYPE_TITLE }` and `size={ SIZE_MEDIUM }`. Its text is `Your traffic compared to your expected range`.
  * Give `InfoTooltip` a `title` made with `createInterpolateElement()` from one translatable string, following the `rateInfoTooltip` in `LeadGenerationPerformanceWidget`:
    * The string is `Site Kit analyzes the last 18 months of your traffic history to estimate a typical range, so you can see when visits are higher or lower than expected. <a>Learn more</a>`.
    * Map `a` to a `Link` with `href="#"`, `external` and `hideExternalIndicator`, like the `Learn more` link in `MetricTileHeader`. The `href` stays `#` until the support page for this chart exists.
  * Pass `tooltipClassName="googlesitekit-info-tooltip__content--typical-traffic"`, so the popup can be given the width in the design: https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=1747-35810&m=dev
  * `InfoTooltip` already opens the popup when the icon is hovered, focused or tapped, and keeps it open while the pointer is over the popup, so the link can be clicked. Add no other open or close handling.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/charts/TypicalTrafficChart.tsx` (new file):
  * Props:
    * `dailyTraffic: BenchmarkingDailyTrafficRow[]`, the decoded rows.
    * `daysInSelectedRange: number`, the number of days in the selected date range.
  * Read nothing from the data store, so a story or a test can render the chart from a fixture.
  * Render a `div` with the classes `googlesitekit-traffic-overview__chart` and `googlesitekit-traffic-overview__chart--typical-traffic`. Inside it, render `TypicalTrafficChartHeader`, then `GoogleChart`, then `ChartLegend`, per the design: https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=1747-32704&m=dev
  * Render `GoogleChart` with `chartType="LineChart"`, `height="256px"` and `width="100%"`, as `TrafficChart` does, and `data` set to the `chartData` from `getTypicalTrafficChartData()`. Build `options` by spreading `TRAFFIC_CHART_OPTIONS` from `trafficChartOptions.ts`, as `TrafficChart` does, so the line color, the date labels, the value axis on the right, the gridlines and the crosshair are the same as on the Traffic Overview chart. Spread its `hAxis` and `vAxis` as well, so their other options stay, and add:
    * `hAxis.ticks`: the returned `ticks`.
    * `hAxis.baseline`: the last plotted day, as `TrafficChart` does, so the gray line runs along the right edge of the chart area.
    * `vAxis.viewWindow.max`: `maximumVisitors`, or `100` when `maximumVisitors` is `0`, as `TrafficChart` does for a range with no visitors.
  * Do not pass `dateMarkers`.
  * Do not pass `gatheringData`. In that state `getChartOptions()` sets `hAxis.viewWindow` to the selected date range, which would cut off the seven days after it that #13842 adds.
  * Render `ChartLegend` with one item, built the way `TrafficChart` builds `legendItems`:
    * The label uses the same two strings, `Last %d day traffic` and `Last %d days traffic`, chosen with `_n()` from `daysInSelectedRange`, so no new string is added. For a 28-day range it reads `Last 28 days traffic`, as in the design.
    * The color is `TRAFFIC_CHART_LINE_COLOR`.
  * Add no legend item for the expected range or for published posts.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/tabs/TypicalTrafficPanel.tsx` (added in #13599):
  * When `response` from `useBenchmarkingData()` is defined, render `TypicalTrafficChart` with:
    * `dailyTraffic` set to `response.dailyTraffic`.
    * `daysInSelectedRange` set to `select( CORE_USER ).getDateRangeNumberOfDays()`.
  * The loading and error states are #13602.

* [ ] In `assets/sass/widgets/_googlesitekit-widget-analyticsTrafficOverview.scss`:
  * Inside the `.googlesitekit-traffic-overview__panel` block:
    * Add `.googlesitekit-traffic-overview__chart--typical-traffic` with the top margin from the design in place of the `70px` that `.googlesitekit-traffic-overview__chart` sets.
    * Style `.googlesitekit-traffic-overview__typical-traffic-chart-header` per the design: the title and the icon on one row, centered vertically, in the colors the design gives them. Set the icon color on `.googlesitekit-info-tooltip`, as `_googlesitekit-km-widget-tile.scss` does.
    * Add no legend rules. The existing `.googlesitekit-traffic-overview__chart-legend` rules already apply, because `TypicalTrafficPanel` has the `googlesitekit-traffic-overview__panel` class.
  * At the top level of the file, outside `.googlesitekit-plugin`, add `.googlesitekit-tooltip.MuiTooltip-tooltip.googlesitekit-info-tooltip__content--typical-traffic` with the popup width from the design, in place of the `160px` `max-width` that the `InfoTooltip` styles set. Follow `.googlesitekit-tooltip.MuiTooltip-tooltip.googlesitekit-new-badge__tooltip`. The popup renders outside the widget, so a rule nested under the widget does not reach it.

The values the chart draws come from the slice in #13598, and the panel that passes them down is #13599. The expected range band, the published-post markers and the feedback control in the design are not part of this issue.

### Test Coverage

* In `tests/phpunit/integration/Modules/Analytics_4/Benchmarking/Report_OptionsTest.php`, replace the two `get_daily_series_options()` tests that expect 395 days:
  * For `2026-08-19` to `2026-09-15`, the report counts visitors by day, oldest first, from `2026-07-22` to `2026-09-15`.
  * The report starts on `2026-09-02` for the 7 days ending on `2026-09-15`, and on `2026-03-20` for the 90 days ending on `2026-09-15`.
* In `tests/phpunit/integration/Modules/Analytics_4/Benchmarking/Response_BuilderTest.php`, on requests for `2026-08-19` to `2026-09-15`:
  * Change `test_build__lists_all_395_days_ending_on_the_end_date_oldest_first` to expect the 28 days from `2026-08-19` to `2026-09-15`, oldest first, and rename it after them.
  * Change `test_build__lists_0_visitors_for_a_day_analytics_returned_no_row_for` to give rows for `2026-08-19` and `2026-08-21`, and to expect `0` visitors on `2026-08-20`.
  * `test_build__sums_the_visitors_of_each_period_from_the_daily_series` keeps passing unchanged: the compare period is summed from the daily series, though `dailyTraffic` does not hold it.
* In `tests/phpunit/integration/Modules/Analytics_4/Datapoints/Get_Benchmarking_DataTest.php`:
  * Change `test_rest_endpoint__accepts_a_period_of_197_days` to accept the 90 days from `2026-06-18` to `2026-09-15`, and `test_rest_endpoint__refuses_a_period_of_198_days` to refuse the 91 days from `2026-06-17` to `2026-09-15` with a message that names `90 days`. Rename both after the new lengths.
* Add `assets/js/modules/analytics-4/components/traffic-overview/charts/getTypicalTrafficChartData.test.ts` covering:
  * 28 rows give 28 points in ascending date order, and a row with `0` visits is a point at `0` rather than a gap.
  * The `number` column is labelled `Visits`.
  * `ticks` holds the date of every row but the first.
  * `maximumVisitors` is the highest value in the rows, and is `0` when every row is `0`.
* Add `assets/js/modules/analytics-4/components/traffic-overview/charts/TypicalTrafficChart.test.tsx`, mocking `GoogleChart` the way `TrafficChart.test.tsx` does, covering:
  * The chart gets 28 points for 28 rows and 90 points for 90 rows.
  * The horizontal axis uses the Traffic Overview chart's `MMM d` labels with the returned ticks, and its gridlines are transparent.
  * The value axis runs to the highest daily value, and to `100` when every day is `0`.
  * Neither `dateMarkers` nor `gatheringData` is passed.
  * The legend shows one item, `Last 28 days traffic` for a 28-day range and `Last 90 days traffic` for a 90-day range, beside a line in `#462083`.
* Add `assets/js/modules/analytics-4/components/traffic-overview/charts/TypicalTrafficChartHeader.test.tsx` covering:
  * The title is a heading with the text `Your traffic compared to your expected range`.
  * Hovering the info icon shows the tooltip text and a `Learn more` link whose `href` is `#`.
* Add `createDailyTrafficRows()` to `assets/js/modules/analytics-4/components/traffic-overview/test-utils.ts` for the tests and the stories. It returns a given number of rows ending on a given day, with each day's visits from a given function. The checked-in `benchmarking-data.json` fixture has only four days.
* Add `assets/js/modules/analytics-4/components/traffic-overview/charts/TypicalTrafficChart.stories.tsx` with stories for a 28-day range, a 90-day range, and a range that is `0` on every day. Give each a `scenario` with `readySelector: '[id^="googlesitekit-chart-"] svg'`, as `TrafficChart.stories.tsx` does.
* Each new story adds a Backstop scenario and needs a new reference image. The `Typical Traffic` scenario added in #13599 now shows the chart, so its reference image changes too. No other reference image moves, because no existing chart's options change.

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
