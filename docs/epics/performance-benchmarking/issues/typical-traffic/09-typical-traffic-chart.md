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
* The chart shows no legend.
* A support link beside the chart opens documentation explaining that the chart covers thirteen months rather than the selected date range, that the shaded region is the selected period, and that the earliest months of a recently created property are the property's own first weeks rather than a quiet season.
* A screen reader reaches, in reading order, each plotted day with its date and its visitor count, the first and last day of the shaded region as the selected period, and the day the property was created where that marker is drawn.

## Implementation Brief

* [ ] In `assets/js/components/GoogleChart/index.js`:
  * Add two optional props, `plottedStartDate` and `plottedEndDate`, and use them in place of the selected date range when deciding `dateMarkersInRange`. Default each to the matching value from `select( CORE_USER ).getDateRangeDates()`, so every existing caller behaves as it does today.
  * Without this, a date marker outside the selected date range is filtered out, and the Typical Traffic chart's property-creation marker almost always falls outside it.
  * Add both to `GoogleChart.propTypes` as optional strings.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/constants.ts`:
  * Add `TYPICAL_TRAFFIC_CHART_DAYS`, set to `395`.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/charts/getTypicalTrafficChartData.ts` (new file), following `getTrafficChartData.ts`:
  * Export `getTypicalTrafficChartData( { dailyTraffic } )`, returning the two-column `GoogleChart` table — a `date` column labelled `Day` and a `number` column labelled `Users` — with one `[ Date, number ]` point per row of `dailyTraffic`, in the order the response gave them. A day with `visitors: 0` is a point with `0`, never a skipped row.
  * Also return `ticks`, one `Date` per month: the first plotted day's month, then the first day of every later month inside the window.
  * Also return `maximumVisitors`, the highest `visitors` in `dailyTraffic`, and `windowStartDate` and `windowEndDate`, the first and last plotted day as `YYYY-MM-DD`.
  * The function derives the window from the rows it is given and never reads the selected date range, so a shorter series on a young property plots what it has.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/charts/typicalTrafficChartOptions.ts` (new file), following `trafficChartOptions.ts`:
  * Export `TYPICAL_TRAFFIC_CHART_OPTIONS` with `curveType: 'function'`, `legend: { position: 'none' }`, `backgroundColor: 'transparent'`, `hAxis.format` set to `MMM`, `hAxis.gridlines.color` set to `transparent`, and `vAxis.viewWindow.min` set to `0`.
  * Set `hAxis.minTextSpacing` explicitly to a value that lets thirteen month labels render at the widget's width, per the design. `getChartOptions()` only fills that option in when it is absent, so setting it here is what stops the default of `100` dropping labels.
  * Reuse the line colour and the axis label colour from `trafficChartOptions.ts` rather than repeating the hex values.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/charts/SelectedRangeRegion.tsx` (new file):
  * Render one `div` with the class `googlesitekit-traffic-overview__selected-range-region` and an `id` built from the instance ID it is given, following how `DateMarker` renders the element `GoogleChart` then positions.
  * It takes the element's `id` as a prop and renders nothing else. Its position is set by the chart's `ready` handler.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/charts/TypicalTrafficChart.tsx` (new file):
  * Props: `dailyTraffic`, the decoded rows; `selectedStartDate` and `selectedEndDate`, the selected range's two days; and `propertyCreateTime`, the raw setting value or `undefined`. The component reads nothing from the data store, so a story or a test can render it from a fixture.
  * Render `GoogleChart` with `chartType="LineChart"`, the table from `getTypicalTrafficChartData()`, the ticks it returned, and `vAxis.viewWindow.max` set to its `maximumVisitors`, so a peak eleven months back sets the scale.
  * Pass `plottedStartDate` and `plottedEndDate` from the same function's `windowStartDate` and `windowEndDate`, and pass `dateMarkers` holding the property's creation day with the text `Google Analytics property created`, built the way `TrafficChart` builds it. Drop the marker when the creation day falls outside the plotted window.
  * Do not pass `gatheringData`. `getChartOptions()` clamps `hAxis.viewWindow` to the selected date range in that state, which would crop thirteen months down to the selected range.
  * Render `SelectedRangeRegion` as a child of `GoogleChart`, and position it in an `onReady` handler from the chart wrapper's `getChartLayoutInterface()`: `getChartAreaBoundingBox()` for the plot box's `top` and `height`, and `getXLocation()` for the left and right edges, called with `stringToDate( selectedStartDate )` and `stringToDate( selectedEndDate )`. Mirror `addKeyDateLinesToChart` in `GoogleChart`, including reading the day back through `getDateString` so the region and the plotted points use the same value. `ready` fires again on every redraw, so the region re-positions when the browser window is resized and when the date range changes.
  * Add the `VisuallyHidden` equivalents the way `TrafficChart` does: one sentence per plotted day with its date and visitor count; one sentence naming the first and last day of the shaded region as the selected period; and the property-creation sentence when the marker is drawn.
  * Show no legend and render no `ChartLegend`.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/charts/TypicalTrafficChartSupportLink.tsx` (new file):
  * Render a `Link` to `select( CORE_SITE ).getDocumentationLinkURL( 'typical-traffic' )`, following `EngagementRateTile`. The support team drafts the copy and the slug before rollout; use `typical-traffic` until then.
  * This is a separate file from the chart because the chart touches no store.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/tabs/TypicalTrafficPanel.tsx`:
  * Render `TypicalTrafficChart` with the decoded `dailyTraffic`, the selected range's two days and the property's creation time, and render `TypicalTrafficChartSupportLink` beside it.

* [ ] In `assets/sass/widgets/_googlesitekit-widget-analyticsTrafficOverview.scss`:
  * Add a wrapper class for the Typical Traffic chart that gives it `position: relative` and `z-index: 0`. The region paints behind the plotted line with a negative `z-index`, which only works inside a stacking context.
  * Style `.googlesitekit-traffic-overview__selected-range-region` per the design: absolutely positioned, `z-index: -1`, and the background tint the design gives it.

The values the chart draws come from the slice in #13598, and the panel that passes them down is #13599.

### Test Coverage

* Add `assets/js/modules/analytics-4/components/traffic-overview/charts/getTypicalTrafficChartData.test.ts` covering:
  * 395 rows give 395 points in ascending date order, and a row with `0` visitors is a point rather than a gap.
  * `ticks` holds one date per month across the window, and the first tick is in the first plotted month.
  * `maximumVisitors` is the highest value anywhere in the window, including a peak eleven months before the end.
  * A series shorter than 395 rows, as a property between thirteen and fourteen months old produces, returns a window matching the rows it was given.
* Add `assets/js/modules/analytics-4/components/traffic-overview/charts/TypicalTrafficChart.test.tsx` covering:
  * The chart plots 395 days whether the selected range is 28 or 90 days, and only the window's last day moves with the range.
  * The screen reader reaches each day with its date and count, the selected period's first and last day, and the property-creation day when the marker is drawn.
  * The marker is drawn for a creation day inside the plotted window and not for one before it, including a creation day outside the selected range but inside the window.
  * No legend is rendered.
* Add `assets/js/components/GoogleChart/index.test.js` covering:
  * A marker outside the selected date range but inside `plottedStartDate` and `plottedEndDate` is drawn.
  * A caller that passes neither prop keeps filtering its markers against the selected date range.
* Add `TypicalTrafficChart.stories.tsx` with stories for a full thirteen-month series, a series whose earliest weeks are zeros on a property between thirteen and fourteen months old, and a series that is flat at zero. Give each a `scenario` with `readySelector: '[id^="googlesitekit-chart-"] svg'`, as `TrafficChart.stories.tsx` does.
* Each new story adds a Backstop scenario and needs a new reference image. Existing references do not move, because no existing chart's options change.

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
