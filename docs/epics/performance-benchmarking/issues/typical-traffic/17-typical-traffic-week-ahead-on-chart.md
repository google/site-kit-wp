# Typical Traffic chart — the week ahead band and its divider

## Feature Description

The Typical Traffic chart from #13600 ends on the last day of the selected date range, and the expected range band from #13800 ends there too. The chart's design continues the band for seven more days, past a thin divider on that last day, so the reader can see the range the site's own history expects for the days just ahead ([Figma](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=1747-32704&m=dev)). The benchmarking response now carries the bounds for those seven days in `forecast`, and the chart does not draw them.

This issue draws the week ahead. The chart's horizontal axis runs seven days past the last day of the selected range, the band continues across those seven days, and a one-pixel divider marks the last day that has visitor counts.

**The week ahead is a band without a line.** The days after the divider have not happened, so there is no visitor count to draw. The band shows the range a normal day would fall in if the site keeps its current course. A line through the middle of that range would look like a prediction of an exact number, and the band makes no such prediction. So the chart draws no line, no points and no value after the divider, and hovering over those days shows no tooltip.

**The band does not break at the divider.** The band after the divider starts from the bounds the band before it has on the last day of the selected range, so the two meet with no gap and no step. It has the same color as the band before it, because it is the same range carried forward.

**The divider marks the last day with visitor counts.** It is a one-pixel vertical line on the last day of the selected range, across the height of the plot area, drawn behind the line of daily visitors. It shows where the line stops, and that the days after it have not happened yet. A reader who cannot see the chart gets the same information from a sentence for screen readers.

**The week is the same seven days for every date range.** It describes where the site is heading now, not the selected period, so it does not grow or shrink with the date range.

**The legend stays as it is, and the value axis grows.** The legend keeps its two items, because the week ahead is the same expected range the legend already names. The value axis covers the week ahead as well, because on a rising trend the band climbs higher after the divider than it does before it.

**No band on the last day means no week ahead.** On a property with fewer than 28 days of traffic history up to and including the last day of the selected range, the response carries no `forecast`. The chart then ends on the last day of the selected range, as it does today, with no divider.

This issue needs the chart from #13600, the expected range band from #13800, and the `forecast` field that #13841 adds to the benchmarking response.

Link to the design doc: https://docs.google.com/document/d/1dsEs6-NjlP_LNqz5md5fnJMuxh9Vd9f88w4DTrZdLok/edit?tab=t.y7e2u5h52vf1

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* When the benchmarking response carries `forecast`, the Typical Traffic chart's horizontal axis runs from the first plotted day to the seventh day after the last day of the selected date range.
* After the last day of the selected range, the chart draws the band from each forward day's `expectedMin` to its `expectedMax`, and draws no line, no points and no value.
* The band after the last day of the selected range has the same color as the band before it, with no edge lines and no points.
* The band before the divider and the band after it meet on the last day of the selected range, with no gap and no step between them.
* A one-pixel vertical divider, in the color the design gives it, runs the full height of the plot area on the last day of the selected range, and the line of daily visitors is drawn over it.
* The gray line along the right edge of the plot area stays at the right edge, on the seventh day after the last day of the selected range.
* The week ahead is seven days long whether the selected range is `Last 7 days`, `Last 14 days`, `Last 28 days` or `Last 90 days`.
* The value axis runs from `0` to the highest of the largest daily visitor count, the largest `expectedMax` before the divider and the largest `expectedMax` after it. On a series whose largest count is `120`, whose largest `expectedMax` before the divider is `150.2` and whose largest `expectedMax` after it is `171.4`, the top of the band after the divider is fully visible.
* The legend shows the same two items as before: the line's item, such as `Last 28 days traffic` for a 28-day range, and `Expected range`.
* Hovering over a day after the divider shows no tooltip. Hovering over a day before it shows the same tooltip as before.
* For a selected range ending on `2026-09-15`, the chart carries the screen-reader sentence `After September 15, 2026, the chart shows only the expected range for the next 7 days, which have not happened yet.`, with the day formatted for the reader's locale.
* When the response carries no `forecast`, the chart ends on the last day of the selected range, as before: no divider, no band after that day, and no screen-reader sentence about the days ahead.
* Changing the date range moves the divider to the new range's last day, and the week ahead to the seven days after it.
* When the browser window is resized, the divider stays on the last day of the selected range and the band after it stays on its seven days.
* The shaded selected-range region still runs from the first day of the selected range to its last, and does not extend past the divider.

## Implementation Brief

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/charts/getTypicalTrafficChartData.ts` (added in #13600):
  * Take an optional `forecast?: BenchmarkingForecastRow[]` beside `dailyTraffic`, with the row type from `assets/js/modules/analytics-4/utils/benchmarking/types.ts` (added in #13841).
  * When `forecast` has rows, add one row to `chartData` for each of them, after the last `dailyTraffic` row. Set its date cell to `{ v: stringToDate( row.date ), f: '' }` and every other cell to `null`. Without these rows, hovering a forward day shows the tooltip of the last plotted day. With them, Google Charts shows an empty tooltip there, which the SCSS below hides.
  * When `forecast` has rows, also return `forecastChartData`, the table of the forecast layer:
    * Columns: a `date` column, a `number` column for the forward series, and two `number` columns with `role: 'interval'`.
    * The first row is the last `dailyTraffic` row, with its `expectedMin` and `expectedMax`, so the two bands meet on that day. Then one row for each `forecast` row, with its bounds.
    * Set each row's `number` cell to the midpoint of its two bounds. Google Charts draws no interval on a row whose series value is `null`.
  * Include each `forecast` row's `expectedMax` in the value-axis maximum that #13800 computes from `visitors` and `expectedMax`.
  * Return `axisEndDate`: the date of the last `forecast` row, or `windowEndDate` when there is no `forecast`. Keep `windowEndDate` as the date of the last `dailyTraffic` row.
  * Keep building `ticks` from the `dailyTraffic` rows only, so the week ahead gets no month label.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/charts/typicalTrafficChartOptions.ts` (added in #13600):
  * Export `getForecastLayerOptions( chartOptions )`. It returns the options of the forecast layer, built by spreading the main chart's options, so both charts have the same `chartArea`, `hAxis.viewWindow`, `vAxis.viewWindow`, `curveType` and `intervals` and draw at the same positions. It changes:
    * `enableInteractivity` to `false`.
    * In `hAxis`, spread from the main chart's: `ticks` to `[]`, `textPosition` to `'none'` and `baselineColor` to `'transparent'`.
    * In `vAxis`, spread from the main chart's: `textPosition` to `'none'`, `baselineColor` to `'transparent'` and `gridlines.color` to `'transparent'`.
    * `series` to one entry, `0`, with `color: TRAFFIC_CHART_LINE_COLOR`, `lineWidth: 0`, `pointSize: 0` and `targetAxisIndex: 1`. Without `targetAxisIndex: 1`, Google Charts adds a value axis on the left. The interval pair takes the series color unless the `intervals` option from #13800 sets one, so the forward band has the band's tint either way.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/charts/ForecastDivider.tsx` (new file), following `SelectedRangeRegion` (#13600):
  * Take one prop, `id: string`, and render one empty `div` with that `id` and the class `googlesitekit-traffic-overview__forecast-divider`. The chart's `onReady` handler sets its position.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/charts/TypicalTrafficChart.tsx` (added in #13600):
  * Add the prop `forecast?: BenchmarkingForecastRow[]` and pass it to `getTypicalTrafficChartData()`.
  * Set `hAxis.baseline` to `stringToDate( axisEndDate )`, in place of the date of the last row of `chartData`, whose date cell can now be an object.
  * Wrap `GoogleChart` in a `div` with the class `googlesitekit-traffic-overview__typical-traffic-plot`.
  * When `forecastChartData` is returned:
    * Add `hAxis.viewWindow` to the main chart's options, from `stringToDate( windowStartDate )` to `stringToDate( axisEndDate )`.
    * Render `ForecastDivider` as a child of `GoogleChart` with an `id` built from `useInstanceId()`. Render it after `SelectedRangeRegion`, so it is painted over the region.
    * In the `onReady` handler, position the divider with the layout that positions the region: `left` from `Math.floor( getXLocation( stringToDate( windowEndDate ) ) )`, and `top` and `height` from `getChartAreaBoundingBox()`, rounded down as `addKeyDateLinesToChart()` in `GoogleChart` rounds them.
    * After `GoogleChart`, inside the new `div`, render a `div` with the class `googlesitekit-traffic-overview__forecast-layer` and `aria-hidden="true"`. In it, render a second `GoogleChart` with `chartType="LineChart"`, `height="256px"`, `width="100%"`, `data` set to `forecastChartData` and `options` set to `getForecastLayerOptions( options )`, where `options` is the main chart's options. The forward band is drawn by this second chart because Google Charts lists every series of a chart in its tooltip, on the last plotted day as well as on the forward days, and no series option leaves one out.
    * Render a `VisuallyHidden` element with the screen-reader sentence from the acceptance criteria. Build it as one translatable string chosen with `_n()` on `forecast.length`, filled with `formatDate( windowEndDate, { month: 'long' } )` from `@/js/util` and `forecast.length`.
  * When there is no `forecastChartData`, render no second chart, no divider and no sentence.
  * Add no legend item for the week ahead.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/tabs/TypicalTrafficPanel.tsx` (added in #13599):
  * Pass `forecast` from the response to `TypicalTrafficChart`.

* [ ] In `assets/sass/widgets/_googlesitekit-widget-analyticsTrafficOverview.scss`, inside the `.googlesitekit-traffic-overview__panel` block:
  * Add `.googlesitekit-traffic-overview__typical-traffic-plot` with `position: relative`.
  * Add `.googlesitekit-traffic-overview__forecast-layer` with `position: absolute`, `top: 0`, `left: 0`, `width: 100%` and `pointer-events: none`, so the pointer reaches the main chart under it. Do not reset the negative left margin that `.googlesitekit-traffic-overview__chart .googlesitekit-chart` gives the layer's chart: the main chart has the same margin, so the two charts line up.
  * After the `.googlesitekit-traffic-overview__chart div[dir]::after` rule, set `content: none` on `.googlesitekit-traffic-overview__forecast-layer div[dir]::after`, so the layer does not draw a second copy of that short line.
  * Add `.googlesitekit-traffic-overview__forecast-divider` with `position: absolute`, `z-index: -1`, `width: 1px` and the background color from the design: https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=1747-32704&m=dev. The `z-index: 0` that #13600 sets on `.googlesitekit-traffic-overview__chart--typical-traffic` keeps the divider behind the line and in front of the widget.
  * Add `.googlesitekit-traffic-overview__chart--typical-traffic div.google-visualization-tooltip:empty` with `display: none`. It hides the empty tooltip of a forward day and nothing else, because every other tooltip has content.

The `forecast` field comes from #13841. The band, its legend item and the value-axis maximum over the band come from #13800. The chart, its `onReady` handler and the selected-range region come from #13600.

### Test Coverage

* In `assets/js/modules/analytics-4/components/traffic-overview/charts/getTypicalTrafficChartData.test.ts` (added in #13600), add cases:
  * With seven `forecast` rows, `chartData` ends with seven rows, dated from the day after the last `dailyTraffic` row to the seventh day after it, each with an empty formatted date and `null` in every other column.
  * `forecastChartData` starts with the last `dailyTraffic` day and that day's bounds, then holds one row for each `forecast` row with its bounds, and each row's series value is the midpoint of its bounds.
  * `axisEndDate` is the date of the last `forecast` row, and `windowEndDate` is still the date of the last `dailyTraffic` row.
  * On a series whose largest count is `120`, whose largest `dailyTraffic` `expectedMax` is `150.2` and whose largest `forecast` `expectedMax` is `171.4`, the value-axis maximum is `171.4`.
  * `ticks` holds no day after the last `dailyTraffic` row, even when a month starts inside the week ahead.
  * Without `forecast`, `chartData` is the same as before, `forecastChartData` is `undefined`, and `axisEndDate` is `windowEndDate`.
* Add `assets/js/modules/analytics-4/components/traffic-overview/charts/typicalTrafficChartOptions.test.ts` covering `getForecastLayerOptions()`:
  * The `chartArea`, `hAxis.viewWindow`, `vAxis.viewWindow`, `curveType` and `intervals` are the main chart's.
  * Interactivity is off, the axes draw no text, no baselines and no gridlines, and the one series draws no line and no points, in `#462083`, on the value axis with index `1`.
* In `assets/js/modules/analytics-4/components/traffic-overview/charts/TypicalTrafficChart.test.tsx` (added in #13600), with the `GoogleChart` mock rendering its `children`:
  * With `forecast`, a second chart inside a `.googlesitekit-traffic-overview__forecast-layer` element with `aria-hidden="true"` gets `forecastChartData`, and both charts get the same `hAxis.viewWindow`, from the first plotted day to the seventh day after the last one.
  * The main chart's `hAxis.baseline` is the seventh day after the last plotted day.
  * Calling the `onReady` handler with a layout that puts the last plotted day at a known position sets the divider's `left`, `top` and `height` to match, and calling it again with new positions moves the divider.
  * For a range ending on `2026-09-15`, the chart carries the screen-reader sentence with `September 15, 2026` and `7`.
  * The chart gets seven forward rows whether `daysInSelectedRange` is `7`, `14`, `28` or `90`.
  * The legend still shows its two items.
  * Without `forecast`, there is one chart, no divider and no sentence about the days ahead, and `hAxis.baseline` is the last plotted day.
* In `assets/js/modules/analytics-4/components/traffic-overview/widgets/TrafficOverviewWidget.test.tsx`, with the Typical Traffic tab selected and the `benchmarking-data.json` response, the chart renders the forecast layer.
* No automated test hovers the chart, because the Jest mock draws no chart and VRT takes still images. The tests above check the empty formatted dates that the hidden tooltip depends on.
* Add `createForecastRows()` to `assets/js/modules/analytics-4/components/traffic-overview/test-utils.ts`, for the tests and the stories. It returns seven `forecast` rows starting the day after a given day, with each day's bounds from a given function.
* In `assets/js/modules/analytics-4/components/traffic-overview/charts/TypicalTrafficChart.stories.tsx` (added in #13600), add stories for a week ahead on a rising trend and on a falling trend. Set each `scenario.readySelector` to `.googlesitekit-traffic-overview__forecast-layer svg`, so the snapshot waits for both charts.
* Each new story adds a VRT scenario and a reference image. The `TypicalTrafficSelected` scenario in `TrafficOverviewWidget.stories.tsx` now draws the week ahead from the fixture's `forecast`, so its reference image changes; set its `readySelector` to the forecast layer's `svg` as well. The stories without `forecast` keep their reference images.

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
