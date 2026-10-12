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

* [ ] <!-- One or more bullet points for how to technically implement the feature. Make sure to include changes to Storybook and visual regression tests where relevant. -->

### Test Coverage

* <!-- One or more bullet points for how to implement automated tests to verify the feature works. -->

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
