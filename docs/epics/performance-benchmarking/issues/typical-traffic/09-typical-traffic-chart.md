# Typical Traffic chart — daily visits across the selected date range

## Feature Description

The Typical Traffic tab answers a question the Traffic Overview tab cannot: is this period normal for this site? This issue adds the chart that question is answered on: a line of daily visits (GA4 sessions) over the selected date range, with the title, the info tooltip and the legend from the design. The band under the line, the expected range, is #13800.

The benchmarking response covers the same days: `dailyTraffic` holds only the days of the selected range, and the datapoint accepts at most 90 days, the longest range in the date-range selector. Like the Traffic Overview chart, the chart marks the day the Analytics property was created when that day is inside the range.

The chart reads only the values that its panel (#13599) passes it from the slice in #13598. The line plots each day's count from `dailyTraffic`, which #13844 names `visits` and #13845 counts in sessions.

Link to the design doc: https://docs.google.com/document/d/1dsEs6-NjlP_LNqz5md5fnJMuxh9Vd9f88w4DTrZdLok/edit?tab=t.y7e2u5h52vf1 (see "Typical traffic chart" and "Data datapoint")
 
<img width="2448" height="614" alt="Image" src="https://github.com/user-attachments/assets/4ddd9a28-6fb0-4f44-b561-5e5f9fe949cc" />

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* On the Typical Traffic tab, the chart plots one point per day of the selected range, 28 for `Last 28 days` and 90 for `Last 90 days`, with a day without visits at `0`. Changing the range redraws it for the new range.
* Hovering a day shows the day and its value, labelled `Visits`.
* The axes match the Traffic Overview chart: day labels such as `Sep 1` with no vertical gridlines, and a value axis from `0` to the highest daily value, or to `100` when every day is `0`.
* The title, the info tooltip with its `Learn more` link to `#`, and the one legend item, such as `Last 28 days traffic`, match the design.
* When the Analytics property was created inside the selected range, the chart marks that day `Google Analytics property created`, with the screen-reader sentence the Traffic Overview chart gives it, on view-only dashboards too. A creation day before the range has no marker.
* With `typicalTraffic` enabled, a `GET` to `/google-site-kit/v1/modules/analytics-4/data/benchmarking-data?startDate=2026-08-19&endDate=2026-09-15` returns `dailyTraffic` for the 28 days from `2026-08-19`, and period totals for `2026-08-19` to `2026-09-15` and `2026-07-22` to `2026-08-18`.
* A request for 91 days or more is refused with a `400` error that names 90 days, and runs no report.

## Implementation Brief

* [ ] In `includes/Modules/Analytics_4/Benchmarking/Report_Options.php`:
  * Replace `DAILY_SERIES_DAYS` with `MAXIMUM_PERIOD_DAYS`, set to `90`: the most days a period can have, which is the longest range the dashboard's date-range selector offers.
  * In `get_daily_series_options()`, start the report on the first day of `get_compare_range()`, in place of `DAILY_SERIES_DAYS - 1` days before `$end_date`, so the report covers the compare period and the selected period and nothing else. Update its docblock.

* [ ] In `includes/Modules/Analytics_4/Benchmarking/Response_Builder.php`, which names each count `visits` and has `sum_visits()` after #13844:
  * Rename `get_daily_traffic()` to `get_daily_series()`, and add a third parameter, `$end_date`. Make it walk every day from `$first_date` to `$end_date`, in place of `Report_Options::DAILY_SERIES_DAYS` days. Each day is still `array( 'date' => 'YYYY-MM-DD', 'visits' => int )`, with `0` for a day the report has no row for.
  * Add a private `get_daily_traffic( array $daily_series, $start_date )`. It returns the days of `$daily_series` from `$start_date` on, oldest first, with `array_slice()`, so the list keeps keys from `0`.
  * In `build()`:
    * Build the daily series with `get_daily_series()`, from the report's `startDate` to `$end_date`.
    * Sum both `visits` totals with `sum_visits()` over the daily series, not over `dailyTraffic`, which does not hold the compare period.
    * Return `get_daily_traffic()` of the daily series as `dailyTraffic`, and update its `@return` description: one day for each day of the selected period, oldest first.

* [ ] In `includes/Modules/Analytics_4/Datapoints/Get_Benchmarking_Data.php`:
  * In `create_request()`, refuse a period longer than `Report_Options::MAXIMUM_PERIOD_DAYS` days, in place of `intdiv( Report_Options::DAILY_SERIES_DAYS, 2 )`, with the same `invalid_param` error. Update the comment above the check, the `@return` description of the method, and the translators comment of the message, whose example is `197`.

* [ ] In `includes/Modules/Analytics_4/Benchmarking/Response_Encoder.php`:
  * The class docblock names thirteen months of daily counts. Change it to name one count for each day of the selected period, at most `Report_Options::MAXIMUM_PERIOD_DAYS`.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/charts/getTypicalTrafficChartData.ts` (new file), following `getTrafficChartData.ts`:
  * Export `getTypicalTrafficChartData( { dailyTraffic }: { dailyTraffic: BenchmarkingDailyTrafficRow[] } ): TypicalTrafficChartData`, with the row type from `assets/js/modules/analytics-4/utils/benchmarking/types.ts`, whose count is `visits` (#13844).
  * Return `chartData`, a `TrafficChartTable`: a `date` column labelled `Day`, as `getTrafficChartData()` builds it, and a `number` column labelled `Visits`. Then one `[ stringToDate( row.date ), row.visits ]` point per row, in the order of the rows. A row with `visits: 0` becomes a point at `0`. Never skip a row.
  * Return `ticks`: the date of every point except the first, as `getTrafficChartData()` returns them.
  * Return `maximumVisits`, the highest `visits` value in the rows.
  * Take the days only from the rows. Do not read the selected date range here.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/charts/TypicalTrafficChartHeader.tsx` (new file), following `MetricTileHeader`:
  * Render a `div` with the class `googlesitekit-traffic-overview__typical-traffic-chart-header`. Inside it, render the title and then an `InfoTooltip`, per the design: https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=1747-32707&m=dev
  * Render the title as a `Typography` with `as="h3"`, `type={ TYPE_TITLE }` and `size={ SIZE_MEDIUM }`. Its text is `Your traffic compared to your expected range`.
  * Give `InfoTooltip` a `title` made with `createInterpolateElement()` from one translatable string, following the `rateInfoTooltip` in `LeadGenerationPerformanceWidget`:
    * The string is `Site Kit analyzes the last 18 months of your traffic history to estimate a typical range, so you can see when visits are higher or lower than expected. <a>Learn more</a>`. #13800 changes it to name 12 months.
    * Map `a` to a `Link` with `href="#"`, `external` and `hideExternalIndicator`, like the `Learn more` link in `MetricTileHeader`.
  * Pass `tooltipClassName="googlesitekit-info-tooltip__content--typical-traffic"`, so the popup can be given the width in the design: https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=1747-35810&m=dev

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/charts/TypicalTrafficChart.tsx` (new file):
  * Props:
    * `dailyTraffic: BenchmarkingDailyTrafficRow[]`, the decoded rows.
    * `daysInSelectedRange: number`, the number of days in the selected date range.
    * `propertyCreateDate?: string`, the day the Analytics property was created, as `YYYY-MM-DD`.
  * Read nothing from the data store, so a story or a test can render the chart from a fixture.
  * Render a `div` with the classes `googlesitekit-traffic-overview__chart` and `googlesitekit-traffic-overview__chart--typical-traffic`. Inside it, render `TypicalTrafficChartHeader`, then `GoogleChart`, then `ChartLegend`, per the design: https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=1747-32704&m=dev
  * Render `GoogleChart` with `chartType="LineChart"`, `height="256px"` and `width="100%"`, as `TrafficChart` does, and `data` set to the `chartData` from `getTypicalTrafficChartData()`. Build `options` by spreading `TRAFFIC_CHART_OPTIONS` from `trafficChartOptions.ts`, as `TrafficChart` does. Spread its `hAxis` and `vAxis` as well, so their other options stay, and add:
    * `hAxis.ticks`: the returned `ticks`.
    * `hAxis.baseline`: the last plotted day, as `TrafficChart` does.
    * `vAxis.viewWindow.max`: `maximumVisits`, or `100` when `maximumVisits` is `0`, as `TrafficChart` does when every day is `0`.
  * Build the property-creation marker the way `TrafficChart` builds `markerDate` and `dateMarkers`, with the first and the last row's `date` in place of the selected range's dates:
    * When `propertyCreateDate` is on or after the first row's `date` and on or before the last row's `date`, pass `dateMarkers` with one marker, whose `date` is `propertyCreateDate` and whose `text` is the existing `Google Analytics property created` string.
    * Otherwise, pass no `dateMarkers`.
    * When the marker is drawn, render the existing `Google Analytics property created on %s.` sentence in a `VisuallyHidden` after the legend, with the day formatted as `TrafficChart` formats it.
  * Do not pass `gatheringData`. A site without enough recorded traffic gets a zero state in place of the chart (#13602).
  * Render `ChartLegend` with one item, built the way `TrafficChart` builds `legendItems`:
    * The label is `Last %d day traffic` or `Last %d days traffic`, the two strings `TrafficChart` uses, chosen with `_n()` from `daysInSelectedRange`.
    * The color is `TRAFFIC_CHART_LINE_COLOR`.
  * Add no other legend item. The `Expected range` item is #13800.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/tabs/TypicalTrafficPanel.tsx` (added in #13599):
  * When `response` from `useBenchmarkingData()` is defined, render `TypicalTrafficChart` with:
    * `dailyTraffic` set to `response.dailyTraffic`.
    * `daysInSelectedRange` set to `select( CORE_USER ).getDateRangeNumberOfDays()`.
    * `propertyCreateDate` set to `getPropertyCreateDate()`, from `assets/js/modules/analytics-4/utils/property-create-date.ts`, of `select( MODULES_ANALYTICS_4 ).getPropertyCreateTime()`.
  * The loading and error states are #13602.

* [ ] In `assets/sass/widgets/_googlesitekit-widget-analyticsTrafficOverview.scss`:
  * Inside the `.googlesitekit-traffic-overview__panel` block:
    * Add `.googlesitekit-traffic-overview__chart--typical-traffic` with the top margin from the design in place of the `70px` that `.googlesitekit-traffic-overview__chart` sets.
    * Style `.googlesitekit-traffic-overview__typical-traffic-chart-header` per the design: the title and the icon on one row, centered vertically, in the colors the design gives them. Set the icon color on `.googlesitekit-info-tooltip`, as `_googlesitekit-km-widget-tile.scss` does.
  * At the top level of the file, outside `.googlesitekit-plugin`, add `.googlesitekit-tooltip.MuiTooltip-tooltip.googlesitekit-info-tooltip__content--typical-traffic` with the popup width from the design, in place of the `160px` `max-width` that the `InfoTooltip` styles set. Follow `.googlesitekit-tooltip.MuiTooltip-tooltip.googlesitekit-new-badge__tooltip`. The popup renders outside the widget, so a rule nested under the widget does not reach it.

The expected range band (#13800), the published-post markers and the feedback control in the design are not part of this issue.

### Test Coverage

* In `tests/phpunit/integration/Modules/Analytics_4/Benchmarking/Report_OptionsTest.php`, replace the two `get_daily_series_options()` tests that expect 395 days:
  * For `2026-08-19` to `2026-09-15`, the report is by `date`, oldest first, from `2026-07-22` to `2026-09-15`.
  * The report starts on `2026-09-02` for the 7 days ending on `2026-09-15`, and on `2026-03-20` for the 90 days ending on `2026-09-15`.
* In `tests/phpunit/integration/Modules/Analytics_4/Benchmarking/Response_BuilderTest.php`, on requests for `2026-08-19` to `2026-09-15`:
  * Change `test_build__lists_all_395_days_ending_on_the_end_date_oldest_first` to expect the 28 days from `2026-08-19` to `2026-09-15`, oldest first, and rename it after them.
  * Change `test_build__lists_0_visits_for_a_day_analytics_returned_no_row_for` to give rows for `2026-08-19` and `2026-08-21`, and to expect `0` visits on `2026-08-20`.
* In `tests/phpunit/integration/Modules/Analytics_4/Datapoints/Get_Benchmarking_DataTest.php`:
  * Change `test_rest_endpoint__accepts_a_period_of_197_days` to accept the 90 days from `2026-06-18` to `2026-09-15`, and `test_rest_endpoint__refuses_a_period_of_198_days` to refuse the 91 days from `2026-06-17` to `2026-09-15` with a message that names `90 days`. Rename both after the new lengths.
* Add `assets/js/modules/analytics-4/components/traffic-overview/charts/getTypicalTrafficChartData.test.ts` covering:
  * 28 rows give 28 points in ascending date order, and a row with `0` visits is a point at `0` rather than a gap.
  * The `number` column is labelled `Visits`.
  * `ticks` holds the date of every row but the first.
  * `maximumVisits` is the highest value in the rows, and is `0` when every row is `0`.
* Add `assets/js/modules/analytics-4/components/traffic-overview/charts/TypicalTrafficChart.test.tsx`, mocking `GoogleChart` the way `TrafficChart.test.tsx` does, covering:
  * The chart gets 28 points for 28 rows and 90 points for 90 rows.
  * The horizontal axis uses the Traffic Overview chart's `MMM d` labels with the returned ticks, and its gridlines are transparent.
  * The value axis runs to the highest daily value, and to `100` when every day is `0`.
  * `gatheringData` is not passed.
  * `dateMarkers` holds one `Google Analytics property created` marker when `propertyCreateDate` is the first, a middle or the last row's date, and is not passed when `propertyCreateDate` is before the first row or is `undefined`. The screen-reader sentence is rendered in the same cases and in no others.
  * The legend shows one item, `Last 28 days traffic` for a 28-day range and `Last 90 days traffic` for a 90-day range, beside a line in `#462083`.
* Add `assets/js/modules/analytics-4/components/traffic-overview/charts/TypicalTrafficChartHeader.test.tsx` covering:
  * The title is a heading with the text `Your traffic compared to your expected range`.
  * Hovering the info icon shows the tooltip text and a `Learn more` link whose `href` is `#`.
* Add `assets/js/modules/analytics-4/components/traffic-overview/tabs/TypicalTrafficPanel.test.tsx` covering:
  * With a response, the panel renders the chart with the response's `dailyTraffic`.
  * The chart marks the property's creation day from `getPropertyCreateTime()` when it is inside the range, for a view-only user too.
* Add `createDailyTrafficRows()` to `assets/js/modules/analytics-4/components/traffic-overview/test-utils.ts` for the tests and the stories. It returns a given number of `BenchmarkingDailyTrafficRow` rows ending on a given day, with each day's `visits` from a given function. The checked-in `benchmarking-data.json` fixture has only four days.
* Add `assets/js/modules/analytics-4/components/traffic-overview/charts/TypicalTrafficChart.stories.tsx` with stories for a 28-day range, a 90-day range, a range with no visits on any day, and a 28-day range with the property's creation day inside it. Give each a `scenario` with `readySelector: '[id^="googlesitekit-chart-"] svg'` and `viewport: 'large'`, as `TrafficChart.stories.tsx` does.
* Each new story adds a VRT scenario with new reference images. The `Typical Traffic Selected (typicalTraffic enabled)` story in `TrafficOverviewWidget.stories.tsx` now shows the chart, so its reference images change too. No other reference image changes, because no existing chart's options change.

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
