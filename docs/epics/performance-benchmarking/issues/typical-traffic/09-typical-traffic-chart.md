# Typical Traffic chart — thirteen months of daily visitors

## Feature Description

The Typical Traffic tab exists to answer one question the Traffic Overview tab cannot: is this period normal for this site? Answering it needs the site's own history well beyond the ninety days the dashboard's date-range selector offers, so that the selected period can be read against the shape of the year around it.

This issue adds the chart that shows it: a single line of daily visitors across the 395 days ending on the last day of the selected date range.

**The window is thirteen months and it does not follow the date-range selector.** The selector decides where the window ends and nothing else about it, so the chart plots the same 395 days whether the reader has 28 or 90 days selected. That independence is the tab's whole point — a chart that shrank to the selected range would plot the series the Traffic Overview tab already plots and answer the question it already answers — and it is the one thing about this chart a reader has to be told, which is what the support link beside it is for.

Three things follow from the window rather than from the line. The horizontal axis carries one tick per month, because weekly ticks across thirteen months are unreadable and daily ticks are not tick marks at all. The value axis is fitted to the whole window, so a seasonal peak eleven months back sets the scale the current period is read against — which is the comparison the chart exists to make, and also why a site with one viral week has a year that looks flat. And the selected date range is marked on the chart rather than isolated by it: a shaded region spanning the selected range shows a reader where the rest of the dashboard is looking inside the year.

**The chart also marks the day the Analytics property was created**, the same marker the Traffic Overview chart carries. It matters more here. On a property between thirteen and fourteen months old the chart's window starts before the property did, so the earliest weeks of the line are genuinely empty, and without the marker that flat run reads as a collapse in traffic rather than as a property that did not exist yet. The chart draws whatever history the property has rather than waiting for a full window.

The line is plotted from raw daily counts, in the same unit as the Traffic Overview chart.

The chart is drawn entirely from the values its panel hands it and reads nothing from the data store itself, which is what lets it be rendered from a fixture. Those values come from the slice in #13598, and the panel that passes them down is #13599.

Link to the design doc: https://docs.google.com/document/d/1dsEs6-NjlP_LNqz5md5fnJMuxh9Vd9f88w4DTrZdLok/edit?tab=t.y7e2u5h52vf1

<img width="1348" height="359" alt="Image" src="https://github.com/user-attachments/assets/814309a2-d883-451f-bcd5-46d2b0cf4eaa" />

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* On the Typical Traffic tab, the chart plots one point per day for the 395 days ending on the last day of the selected date range, as a single line of daily visitors.
* Changing the date range from `Last 28 days` to `Last 90 days` leaves the chart plotting 395 days and moves only where the window ends, so the horizontal axis still spans thirteen months.
* A day with no visitors is plotted as `0` rather than skipped, so the line has no break and every day occupies its own position on the axis.
* The horizontal axis carries one tick per month, labelled with the short form of the month name in the reader's language, over gridlines that are not drawn.
* The value axis spans `0` to the highest daily value anywhere in the thirteen-month window, so a peak eleven months back sets the scale the selected period is read against.
* A shaded region spans the selected date range, from its first day to its last, behind the plotted line.
* The shaded region stays aligned with the selected range's days when the browser window is resized and when the chart redraws.
* Selecting a different date range moves the shaded region to the new range and moves the end of the window to the new last day.
* Where the day the Analytics property was created falls inside the thirteen-month window, the chart marks that day and names it `Google Analytics property created`.
* On a property created fourteen months ago, the chart's earliest weeks plot `0` visitors up to the property's creation day, and the marker sits on that day.
* The expected range, published posts, and the feedback element are out-of-scope for this issue.

## Implementation Brief

* [ ] In `assets/js/components/GoogleChart/index.js`:
  * Add two optional props, `plottedStartDate` and `plottedEndDate`, each a day as `YYYY-MM-DD`. Use them in place of the selected date range in `isDateWithinRange()`, which decides `dateMarkersInRange`. When a prop is not passed, use the matching value from `select( CORE_USER ).getDateRangeDates()`, so every existing chart keeps the markers it draws today.
  * The Typical Traffic chart plots days outside the selected date range, and without these props a marker on one of those days is filtered out.
  * Add both to `GoogleChart.propTypes` as optional strings.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/constants.ts`:
  * Add `TYPICAL_TRAFFIC_CHART_DAYS`, set to `395`, the number of days the Typical Traffic chart plots.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/charts/getTypicalTrafficChartData.ts` (new file), following `getTrafficChartData.ts`:
  * Export `getTypicalTrafficChartData( { dailyTraffic }: { dailyTraffic: BenchmarkingDailyTrafficRow[] } ): TypicalTrafficChartData`, with the row type from `assets/js/modules/analytics-4/utils/benchmarking/types.ts`.
  * Return `chartData`, a `TrafficChartTable`: a `date` column labelled `Day` and a `number` column labelled `Users`, as `getTrafficChartData()` builds them, then one `[ stringToDate( row.date ), row.visitors ]` point per row, in the order of the rows. A row with `visitors: 0` becomes a point at `0`. Never skip a row.
  * Return `ticks`: one `Date` for the first day of each month inside the window.
  * Return `maximumVisitors`, the highest `visitors` value in the rows, and `windowStartDate` and `windowEndDate`, the `date` of the first row and of the last row.
  * Take the window only from the rows. Do not read the selected date range here.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/charts/typicalTrafficChartOptions.ts` (new file):
  * Export `TYPICAL_TRAFFIC_CHART_OPTIONS`, built by spreading `TRAFFIC_CHART_OPTIONS` from `trafficChartOptions.ts`, so the line color, the value axis on the right, the gridlines and the crosshair are the same as on the Traffic Overview chart, as the design shows. Spread `hAxis` as well, so its other options stay.
  * Change three options:
    * `backgroundColor` to `'transparent'`, so the selected-range region behind the chart can be seen.
    * `hAxis.format` to `'MMM'`.
    * `hAxis.minTextSpacing` to a value at which all thirteen month labels fit at the chart's width in the design. `getChartOptions()` sets it to `100` only when it is missing, and at `100` Google Charts hides some of the month labels.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/charts/SelectedRangeRegion.tsx` (new file):
  * Take one prop, `id: string`, and render one empty `div` with that `id` and the class `googlesitekit-traffic-overview__selected-range-region`, the way `DateMarker` renders the line that `GoogleChart` positions. The chart's `onReady` handler sets its position.

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
    * `selectedStartDate: string` and `selectedEndDate: string`, the first and last day of the selected date range.
    * `daysInSelectedRange: number`, the number of days in the selected date range.
    * `propertyCreateTime?: string`, the raw setting value.
  * Read nothing from the data store, so a story or a test can render the chart from a fixture.
  * Render a `div` with the classes `googlesitekit-traffic-overview__chart` and `googlesitekit-traffic-overview__chart--typical-traffic`. Inside it, render `TypicalTrafficChartHeader`, then `GoogleChart`, then `ChartLegend`, per the design: https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=1747-32704&m=dev
  * Render `GoogleChart` with `chartType="LineChart"`, `height="256px"` and `width="100%"`, as `TrafficChart` does, and `data` set to the `chartData` from `getTypicalTrafficChartData()`. Build `options` from `TYPICAL_TRAFFIC_CHART_OPTIONS` and add:
    * `hAxis.ticks`: the returned `ticks`.
    * `hAxis.baseline`: the last plotted day, as `TrafficChart` does, so the gray line runs along the right edge of the chart area.
    * `vAxis.viewWindow.max`: `maximumVisitors`, or `100` when `maximumVisitors` is `0`, as `TrafficChart` does for a range with no visitors.
  * Pass `plottedStartDate` and `plottedEndDate`, set to the returned `windowStartDate` and `windowEndDate`.
  * Pass `dateMarkers` with the property's creation day and the text `Google Analytics property created`, built the way `TrafficChart` builds them, but compare the day with `windowStartDate` and `windowEndDate` instead of the selected range. Pass no marker when `propertyCreateTime` is `undefined` or the day is outside the window.
  * Do not pass `gatheringData`. In that state `getChartOptions()` sets `hAxis.viewWindow` to the selected date range, which cuts the thirteen months down to the selected range.
  * Render `SelectedRangeRegion` as the child of `GoogleChart`, with an `id` built from `useInstanceId()`, as `TrafficBreakdownColumn` builds its heading `id`. Pass `GoogleChart` an `onReady` handler that positions the region, following `addKeyDateLinesToChart()` in `GoogleChart`:
    * Read `chartWrapper` from the handler's argument, and get the layout from `chartWrapper.getChart().getChartLayoutInterface()`.
    * Set the region's `top` and `height` from `getChartAreaBoundingBox()`.
    * Set its `left` from `getXLocation( stringToDate( selectedStartDate ) )`, and its `width` from the distance between that and `getXLocation( stringToDate( selectedEndDate ) )`. The points are built with `stringToDate()` as well, so both edges are at the same x positions as the plotted days.
    * `ready` fires again after every redraw, including the redraw after a browser resize and after a date range change, so the region moves with the chart without any other listener.
  * Render `ChartLegend` with one item, built the way `TrafficChart` builds `legendItems`:
    * The label uses the same two strings, `Last %d day traffic` and `Last %d days traffic`, chosen with `_n()` from `daysInSelectedRange`, so no new string is added. For a 28-day range it reads `Last 28 days traffic`, as in the design.
    * The color is `TRAFFIC_CHART_LINE_COLOR`.
  * Add no legend item for the expected range or for published posts.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/tabs/TypicalTrafficPanel.tsx` (added in #13599):
  * When `response` from `useBenchmarkingData()` is defined, render `TypicalTrafficChart` with:
    * `dailyTraffic` set to `response.dailyTraffic`.
    * `selectedStartDate` and `selectedEndDate` set to the `startDate` and `endDate` the hook returns.
    * `daysInSelectedRange` set to `select( CORE_USER ).getDateRangeNumberOfDays()`.
    * `propertyCreateTime` set to `select( MODULES_ANALYTICS_4 ).getPropertyCreateTime()`.
  * The loading and error states are #13602.

* [ ] In `assets/sass/widgets/_googlesitekit-widget-analyticsTrafficOverview.scss`:
  * Inside the `.googlesitekit-traffic-overview__panel` block:
    * Add `.googlesitekit-traffic-overview__chart--typical-traffic` with `position: relative`, `z-index: 0`, and the top margin from the design in place of the `70px` that `.googlesitekit-traffic-overview__chart` sets. The `z-index: 0` creates a stacking context, which is what makes the region's `z-index: -1` put it behind the line rather than behind the whole widget.
    * Style `.googlesitekit-traffic-overview__typical-traffic-chart-header` per the design: the title and the icon on one row, centered vertically, in the colors the design gives them. Set the icon color on `.googlesitekit-info-tooltip`, as `_googlesitekit-km-widget-tile.scss` does.
    * Style `.googlesitekit-traffic-overview__selected-range-region` with `position: absolute`, `z-index: -1`, and a background tint. The current design does not show this region, so get the tint from the designer.
    * Add no legend rules. The existing `.googlesitekit-traffic-overview__chart-legend` rules already apply, because `TypicalTrafficPanel` has the `googlesitekit-traffic-overview__panel` class.
  * At the top level of the file, outside `.googlesitekit-plugin`, add `.googlesitekit-tooltip.MuiTooltip-tooltip.googlesitekit-info-tooltip__content--typical-traffic` with the popup width from the design, in place of the `160px` `max-width` that the `InfoTooltip` styles set. Follow `.googlesitekit-tooltip.MuiTooltip-tooltip.googlesitekit-new-badge__tooltip`. The popup renders outside the widget, so a rule nested under the widget does not reach it.

The values the chart draws come from the slice in #13598, and the panel that passes them down is #13599. The expected range band, the published-post markers and the feedback control in the design are not part of this issue.

### Test Coverage

* Add `assets/js/modules/analytics-4/components/traffic-overview/charts/getTypicalTrafficChartData.test.ts` covering:
  * 395 rows give 395 points in ascending date order, and a row with `0` visitors is a point at `0` rather than a gap.
  * Rows whose first weeks are all `0` keep a point for each of those days.
  * `ticks` holds the first day of each month inside the window, and no other day.
  * `maximumVisitors` is the highest value anywhere in the window, including a peak eleven months before the last day, and is `0` when every row is `0`.
  * `windowStartDate` and `windowEndDate` are the dates of the first and last rows.
* Add `assets/js/modules/analytics-4/components/traffic-overview/charts/TypicalTrafficChart.test.tsx`, mocking `GoogleChart` the way `TrafficChart.test.tsx` does, with the mock also rendering its `children`, covering:
  * The chart gets 395 points whether the selected range is 28 or 90 days, and only the window's last day moves when the range's last day moves.
  * The horizontal axis is labelled with the short month name, and its gridlines are transparent.
  * The value axis runs to the highest daily value, and to `100` when every day is `0`.
  * The marker is passed for a creation day inside the window, including one outside the selected range, and not for a creation day before the window. `plottedStartDate` and `plottedEndDate` are the window's first and last day.
  * `gatheringData` is not passed.
  * Calling the `onReady` handler with a chart layout that puts the selected range's first and last day at known positions sets the region's `left`, `width`, `top` and `height` to match, and calling it again with new positions moves the region.
  * The legend shows one item, `Last 28 days traffic` for a 28-day range and `Last 90 days traffic` for a 90-day range, beside a line in `#462083`.
* Add `assets/js/modules/analytics-4/components/traffic-overview/charts/TypicalTrafficChartHeader.test.tsx` covering:
  * The title is a heading with the text `Your traffic compared to your expected range`.
  * Hovering the info icon shows the tooltip text and a `Learn more` link whose `href` is `#`.
* Add `assets/js/components/GoogleChart/index.test.tsx` covering:
  * A marker outside the selected date range but inside `plottedStartDate` and `plottedEndDate` is drawn.
  * A chart that passes neither prop draws only the markers inside the selected date range, as it does today.
* Add `createDailyTrafficRows()` to `assets/js/modules/analytics-4/components/traffic-overview/test-utils.ts` for the tests and the stories. It returns `TYPICAL_TRAFFIC_CHART_DAYS` rows ending on a given day, with each day's visitors from a given function. The checked-in `benchmarking-data.json` fixture has only four days.
* Add `assets/js/modules/analytics-4/components/traffic-overview/charts/TypicalTrafficChart.stories.tsx` with stories for a full thirteen-month series; a series whose first weeks are `0`, with the property-creation marker on the first day that has visitors; and a series that is `0` on every day. Give each a `scenario` with `readySelector: '[id^="googlesitekit-chart-"] svg'`, as `TrafficChart.stories.tsx` does.
* Each new story adds a Backstop scenario and needs a new reference image. The `Typical Traffic` scenario added in #13599 now shows the chart, so its reference image changes too. No other reference image moves, because no existing chart's options change.

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
