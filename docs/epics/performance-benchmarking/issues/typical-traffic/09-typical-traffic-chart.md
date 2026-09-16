# Typical Traffic chart — thirteen months of daily visitors

## Feature Description

The Typical Traffic tab exists to answer one question the Traffic Overview tab cannot: is this period normal for this site? Answering it needs the site's own history well beyond the ninety days the dashboard's date-range selector offers, so that the selected period can be read against the shape of the year around it.

This issue adds the chart that shows it: a single line of daily visitors across the 395 days ending on the last day of the selected date range.

**The window is thirteen months and it does not follow the date-range selector.** The selector decides where the window ends and nothing else about it, so the chart plots the same 395 days whether the reader has 28 or 90 days selected. That independence is the tab's whole point — a chart that shrank to the selected range would plot the series the Traffic Overview tab already plots and answer the question it already answers — and it is the one thing about this chart a reader has to be told, which is what the support link beside it is for.

Three things follow from the window rather than from the line. The horizontal axis carries one tick per month, because weekly ticks across thirteen months are unreadable and daily ticks are not tick marks at all. The value axis is fitted to the whole window, so a seasonal peak eleven months back sets the scale the current period is read against — which is the comparison the chart exists to make, and also why a site with one viral week has a year that looks flat. And the selected date range is marked on the chart rather than isolated by it: a shaded region spanning the selected range shows a reader where the rest of the dashboard is looking inside the year.

**The chart also marks the day the Analytics property was created**, the same marker the Traffic Overview chart carries. It matters more here. On a property between thirteen and fourteen months old the chart's window starts before the property did, so the earliest weeks of the line are genuinely empty, and without the marker that flat run reads as a collapse in traffic rather than as a property that did not exist yet. The chart draws whatever history the property has rather than waiting for a full window.

The line is plotted from raw daily counts, in the same unit as the Traffic Overview chart.

The chart is drawn entirely from the values its panel hands it and reads nothing from the data store itself, which is what lets it be rendered from a fixture. Those values come from the slice in #13598, and the panel that passes them down is #13599.

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

* [ ] <!-- One or more bullet points for how to technically implement the feature. Make sure to include changes to Storybook and visual regression tests where relevant. -->

### Test Coverage

* <!-- One or more bullet points for how to implement automated tests to verify the feature works. -->

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
