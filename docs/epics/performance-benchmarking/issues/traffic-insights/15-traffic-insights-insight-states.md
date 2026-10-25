# Generated insight — the Generating and Reporting states

GitHub issue: [#13952](https://github.com/google/site-kit-wp/issues/13952)

## Feature Description

The numbers and the insight come from two separate requests. The numbers arrive first. The insight arrives a few seconds later, or not at all. This issue adds the two states in which the insight is not shown, on both tabs:

* **Generating**: the insight is coming. The teaser (#13947) and the insight block (#13948) show placeholders at the height of their text. So the tab does not move when the text arrives.
* **Reporting**: the insight is not coming. This covers every outcome other than an insight that the `benchmarking` slice (#13946) records: a failure, a rate limit, a generation that is lost twice, the waiting deadline, and a data response without a payload. The teaser and the block are not shown at all, and nothing else on the tab changes.

A failure of the insight never puts a tab in its error state. The error state belongs to the data request.

The insight arrives after the reader may have started to read the tab. So the insight is placed in a polite live region: a screen reader reads the text when it arrives, and the focus does not move.

What the Reporting state says, if anything, is still an open question. The same question asks whether a `429` says something different from a failure.

Link to the design doc: https://docs.google.com/document/d/1dsEs6-NjlP_LNqz5md5fnJMuxh9Vd9f88w4DTrZdLok/edit?pli=1&tab=t.ti7yrmnh2lrv#heading=h.xai0p0vhie15 (see "Insight states" and "Accessibility (a11y)")

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* With `trafficInsights` enabled, while the insight is loading, the top of the Traffic Overview tab and the top of the Typical Traffic tab show placeholders at the size of the teaser and of the insight block.
* The numbers, both charts and the key factor cards are shown as soon as the data response arrives, while the placeholders are still shown.
* When the insight arrives, it replaces the placeholders, and nothing else on the tab moves.
* The teaser and the insight block are not shown after any of these: a `429`, `403`, `400` or `500` error, an operation that failed, a generation that was lost twice, the waiting deadline, a failed data request, or a data response without a payload. The rest of each tab looks the same as while the insight was loading.
* No insight failure shows an error on either tab.
* A screen reader reads the insight when it arrives, and the focus stays where it was.

## Implementation Brief

* [ ] <!-- One or more bullet points for how to technically implement the feature. Make sure to include changes to Storybook and visual regression tests where relevant. -->

### Test Coverage

* <!-- One or more bullet points for how to implement automated tests to verify the feature works. -->

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
