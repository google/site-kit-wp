# Typical Traffic tab — generated insight with the traffic performance and the primary drivers

GitHub issue: [#13948](https://github.com/google/site-kit-wp/issues/13948)

## Feature Description

The Typical Traffic tab shows the period against its expected range, and the key factor cards. But the reader has to decide alone whether the period was normal, and which change explains it. This issue adds the full generated insight at the top of the tab ([Figma](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=552-10450&m=dev)). The insight has two parts: the traffic performance (`text`) and the primary drivers (`driver`). The primary drivers describe the key factor cards (#13601) on the same tab.

The insight uses the `GeneratedInsight` component from the Traffic Overview teaser (#13947), with the same scenario treatment and the same bold text.

The insight always covers the 28 days that end on the selected end date. On any other range, the cards cover the selected range. Which cards the text describes in that case, and how the block says so, is still an open question. It blocks the copy of this block.

Link to the design doc: https://docs.google.com/document/d/1dsEs6-NjlP_LNqz5md5fnJMuxh9Vd9f88w4DTrZdLok/edit?pli=1&tab=t.ti7yrmnh2lrv#heading=h.xai0p0vhie15 (see "Generated insight", "Key factor cards" and "Insight states")

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* With `trafficInsights` enabled, when the Typical Traffic tab is ready or partial (#13602) and the insight has arrived, the top of the tab shows the traffic performance part (`text`) and the primary drivers part (`driver`), as in the design.
* The block shows the same icon and emphasis as the teaser (#13947) for the same scenario, and the default icon and emphasis for an unknown scenario.
* In both parts, `**…**` is shown in bold, and everything else is shown exactly as typed.
* A `text` of 280 characters and a `driver` of 230 characters are shown in full at every screen size.
* The chart and the key factor cards are shown as soon as the data response arrives, whatever the state of the insight.
* When the tab shows one of its zero states (#13602), the block is not shown.
* The block is also shown on the view-only dashboard.
* With `trafficInsights` disabled, the Typical Traffic tab is the same as before.

## Implementation Brief

* [ ] <!-- One or more bullet points for how to technically implement the feature. Make sure to include changes to Storybook and visual regression tests where relevant. -->

### Test Coverage

* <!-- One or more bullet points for how to implement automated tests to verify the feature works. -->

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
