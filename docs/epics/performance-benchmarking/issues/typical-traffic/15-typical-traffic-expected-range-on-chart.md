# Typical Traffic chart — the expected range band and its legend item

## Feature Description

The Typical Traffic chart from #13600 draws a single line of daily visitors across thirteen months. A reader can see that traffic went down, but not whether that is normal for their site. The chart's title, `Your traffic compared to your expected range`, already promises the comparison, and the chart does not draw it.

This issue draws the expected range on the chart: a shaded band under the line that shows, for every day, the lowest and the highest number of visitors the site's own history makes normal for that day. A day where the line goes above the band had more visitors than expected; a day where it goes below had fewer. The legend gets a second item that names the band.

**The band runs under the whole line.** Every `dailyTraffic` row of the benchmarking response now carries `expectedMin` and `expectedMax`, and the chart draws the band between them on every one of the 395 days, not only inside the selected date range. The chart computes no bound itself; it draws the numbers the response gives it.

**Some days have no band, and the chart leaves them empty.** A day needs four weeks of recorded traffic behind it to have an expected range. On a young property, or on one that was tagged long after it was created, the first weeks of the window have no bounds. The chart draws no band on those days and does not join the band across them, so the band starts where the expected range starts. The line is still drawn on those days. The property-creation marker that #13600 adds, or the run of zeros in the line, is what explains the gap.

**The band is drawn as an area, as the design shows it.** It is a light tint of the line's violet, with no edge lines and no points. The selected-range region behind the chart is lighter than the band, so the band can still be seen inside the selected range, which is where the reader is looking ([Figma](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=1747-32704&m=dev)).

**The value axis makes room for the band.** On a day the site gets fewer visitors than expected, the band sits above the line. An axis fitted to the line alone would cut off the top of the band, so the axis maximum now covers the higher of the largest daily value and the largest upper bound.

**The legend names the band with a block.** The legend below the chart is the same `ChartLegend` the Traffic Overview chart uses, and it draws every item with a short bar, which is right for a line. The band is an area, so its item gets a filled block in the band's tint instead, labelled `Expected range`. Because the two items have different shapes, a reader who cannot tell the two colors apart can still tell the line from the band. The Traffic Overview chart's legend keeps its bar exactly as it is.

**The tooltip says 12 months.** The info tooltip next to the chart's title currently says that Site Kit analyzes the last 18 months of traffic history. The expected range reads the last 12 months, so the tooltip now says 12.

This issue needs the chart from #13600 and the `expectedMin` and `expectedMax` bounds that #13799 adds to the benchmarking response.

Link to the design doc: https://docs.google.com/document/d/1dsEs6-NjlP_LNqz5md5fnJMuxh9Vd9f88w4DTrZdLok/edit?tab=t.y7e2u5h52vf1

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* On the Typical Traffic tab, the chart draws a filled band under the line of daily visitors, from each day's `expectedMin` to its `expectedMax`, on every day of the 395-day window that has both bounds.
* The band has no edge lines and no points, and its color is the tint of the line color `#462083` given in the design.
* Inside the selected date range, the band is drawn over the shaded selected-range region and can be seen against it, and the line is drawn over the band.
* A day whose `expectedMin` and `expectedMax` are `null` has no band, and the band is not drawn across it from the day before to the day after:
  * On a series whose first 40 days have `null` bounds, the band starts on day 41 and the line is drawn from day 1.
  * On a series whose bounds are `null` on every day, the chart draws the line and no band.
* The value axis runs from `0` to the higher of the largest daily visitor count and the largest `expectedMax` in the window. On a series whose largest count is `120` and whose largest `expectedMax` is `183.1`, the top of the band is fully visible on every day.
* On a series with `0` visitors and `null` bounds on every day, the value axis runs from `0` to `100`, as it does today.
* The legend below the chart shows two items, in this order:
  * The line's item as it is today, such as `Last 28 days traffic` for a 28-day range, beside a short bar in `#462083`.
  * `Expected range`, beside a filled block in the band's color.
* The Traffic Overview chart's legend is unchanged: one item, `Last 28 days traffic` for a 28-day range, beside a short bar in `#462083`.
* The info tooltip beside the chart's title reads `Site Kit analyzes the last 12 months of your traffic history to estimate a typical range, so you can see when visits are higher or lower than expected. Learn more`, and `Learn more` is still a link.
* Changing the date range moves the selected-range region and the end of the window as before, and the band follows the new window's bounds.
* The band, the line and the selected-range region keep their positions when the browser window is resized.

## Implementation Brief

* [ ] <!-- One or more bullet points for how to technically implement the feature. Make sure to include changes to Storybook and visual regression tests where relevant. -->

### Test Coverage

* <!-- One or more bullet points for how to implement automated tests to verify the feature works. -->

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
