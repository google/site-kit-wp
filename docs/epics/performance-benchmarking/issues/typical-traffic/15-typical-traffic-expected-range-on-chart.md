# Typical Traffic chart — the expected range band and its legend item

## Feature Description

The Typical Traffic chart (#13600) draws a line of daily visits, but not what is normal for the site, although its title promises that comparison. This issue draws the expected range from #13799 as a band under the line ([Figma](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=1747-32704&m=dev)), and adds `Expected range` to the legend. The chart draws the bounds the response gives it and computes none itself.

A day without bounds, in the first four weeks of a site's recorded traffic, is left empty, so on a young site the band starts partway into the range. The band's legend item is a filled block, so it is told apart from the line's bar without relying on color. The info tooltip names 12 months, the history the range reads.

Link to the design doc: https://docs.google.com/document/d/1dsEs6-NjlP_LNqz5md5fnJMuxh9Vd9f88w4DTrZdLok/edit?tab=t.y7e2u5h52vf1 (see "Typical traffic chart" and "Chart table and options")

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* The chart draws a filled band under the line, from each day's `expectedMin` to its `expectedMax`, in a tint of `#462083` with no edge lines and no points, as in the design.
* A day with `null` bounds has no band, and the band is not joined across it. When the first 10 days have `null` bounds, the band starts on day 11 and the line on day 1. When every day has `null` bounds, the chart draws only the line.
* The value axis reaches the higher of the largest daily count and the largest `expectedMax`: with `120` and `183.1`, the whole band is visible.
* The legend shows the line's item, then `Expected range` beside a filled block in the band's color. The Traffic Overview chart's legend is unchanged.
* The info tooltip reads `Site Kit analyzes the last 12 months of your traffic history to estimate a typical range, so you can see when visits are higher or lower than expected. Learn more`.

## Implementation Brief

* [ ] <!-- One or more bullet points for how to technically implement the feature. Make sure to include changes to Storybook and visual regression tests where relevant. -->

### Test Coverage

* <!-- One or more bullet points for how to implement automated tests to verify the feature works. -->

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
