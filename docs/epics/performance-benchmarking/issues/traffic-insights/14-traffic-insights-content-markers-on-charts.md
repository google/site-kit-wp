# Traffic Overview and Typical Traffic charts — content markers for recently published posts

GitHub issue: [#13951](https://github.com/google/site-kit-wp/issues/13951)

## Feature Description

This issue shows `contentMarkers` (#13945) from `GET:benchmarking-data` on both charts. On each day when something was published, a dot is shown on the traffic line, at that day's value. Clicking a dot opens a card with the post titles, the publish date and a link to each post. The legend gets a new item with a dot, only when the range has a marker. The [charts PoC](https://storage.googleapis.com/site-kit-github-artifacts/temp/performance-benchmarking-charts.html) is the reference for both charts.

A dot is used, not the dashed line that marks the day the Analytics property was created. A dot looks like a point on the traffic, but a full-height line looks like a boundary in it.

**Traffic Overview chart.** Google's own hover tooltip is turned off, so the marker card is the only card on this chart, and a click selects the dot that was clicked.

**Typical Traffic chart.** The chart keeps its hover tooltip, which shows each day's `Visits` (#13600). A click on a day that has a marker opens the marker card next to it.

The Traffic Overview tab now requests `GET:benchmarking-data` on every load, for the markers. Both tabs read the same response, so there is one request for each date range.

Link to the design doc: https://docs.google.com/document/d/1dsEs6-NjlP_LNqz5md5fnJMuxh9Vd9f88w4DTrZdLok/edit?pli=1&tab=t.ti7yrmnh2lrv#heading=h.xai0p0vhie15 (see "Content markers on the charts", "Chart construction" and "Chart data tables and options")

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* With `trafficInsights` enabled, each chart shows a dot on the traffic line on each day that has a content marker, at that day's value: visitors on the Traffic Overview chart, and visits on the Typical Traffic chart. Both charts mark the same days.
* Each dot has a white outline, so it stands out from the line under it.
* Clicking a dot on the Traffic Overview chart, or anywhere on a marked day on the Typical Traffic chart, opens a card above the dot. The card lists each post's title, its publish date and a link to the post. When two posts were published that day, the card lists both.
* Clicking a day without a marker closes the card.
* A keyboard user can open each marker's card and reach its links.
* The legend shows the marker item, with a dot, only when the range has at least one marker.
* The Traffic Overview chart shows no hover tooltip.
* The Typical Traffic chart still shows its hover tooltip with the day and its `Visits`, with no marker value in it, and still shows its expected range band (#13800).
* When `contentMarkers` is empty, both charts look the same as with `trafficInsights` disabled.
* Opening the Traffic Overview tab and then the Typical Traffic tab for the same range sends one `GET:benchmarking-data` request.
* When the `GET:benchmarking-data` request fails, the Traffic Overview tab shows its numbers and its chart without markers, and shows no error.

## Implementation Brief

* [ ] <!-- One or more bullet points for how to technically implement the feature. Make sure to include changes to Storybook and visual regression tests where relevant. -->

### Test Coverage

* <!-- One or more bullet points for how to implement automated tests to verify the feature works. -->

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
