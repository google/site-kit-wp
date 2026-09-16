# Loading and error states for the Typical Traffic tab

## Feature Description

Everything the Typical Traffic tab draws comes from one request, so the tab has one thing to wait for and one thing that can fail. This issue adds what a reader sees in each case.

**Loading.** The first time a reader selects the tab, the request has not been sent yet, so the tab opens on placeholders shaped like the chart and the factor blocks that will replace them. Selecting the tab a second time in the same hour is immediate, because the response is already in the reader's browser.

**Error.** When the request fails, the tab shows the plugin's report error, so the retry and the request-access affordances a reader already knows from other widgets apply here too. Retrying clears the stored response and sends the request again rather than showing the same failure from storage. Nothing about a failure here touches the Traffic Overview tab beside it, which resolves its own reports.

**Ready.** The chart and the factor blocks are on screen.

There is no fourth state, and the two that are missing are missing deliberately.

There is no gathering-data state. A property that is still gathering data cannot be thirteen months old, so the tab is not there to show one.

There is no zero-data state either. A property with thirteen months of history and no traffic in the selected period gets a chart showing exactly that and factor blocks whose numbers are zeros. That is a more honest answer than a call to action: the reader asked whether this period is normal for their site, and a flat line is the answer.

This issue lands after the chart and the factor blocks, because both have to be present for the placeholders to be shaped against them. The chart is #13600, the factor blocks are #13601, and the loading flag, the error and the clear action come from #13598.

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* Selecting the Typical Traffic tab for the first time shows placeholder blocks in place of the chart and each factor block until the response arrives, and the placeholders occupy the space the chart and the blocks will take, so nothing below the widget moves when they are replaced.
* When the response arrives, the placeholders are replaced by the chart and the factor blocks together, rather than one block at a time.
* Selecting a different tab and returning to Typical Traffic within the hour shows the chart and the factor blocks with no placeholder step and sends no request.
* Selecting a date range the tab has not shown before sends a request and shows the placeholders again until it resolves.
* When the request fails, the tab shows the plugin's report error for Analytics in place of the chart and the factor blocks, with its retry action.
* Retrying after a failure sends a new request that reaches the server rather than returning the failure from browser storage, and shows the placeholders while it is in flight.
* Where the reader is on a shared dashboard and the failure is one they can act on, the error offers the request-access action the same error offers in other widgets.
* A failure on the Typical Traffic tab leaves the Traffic Overview tab unchanged: selecting it shows its visitor total, its chart and its breakdown as before.
* On a property with thirteen months of history and no visitors in the selected period, the tab shows the chart with its line at `0` and the factor blocks with their values at `0`, and shows no call to action and no "gathering data" message.
* The tab never shows a gathering-data state.

## Implementation Brief

* [ ] <!-- One or more bullet points for how to technically implement the feature. Make sure to include changes to Storybook and visual regression tests where relevant. -->

### Test Coverage

* <!-- One or more bullet points for how to implement automated tests to verify the feature works. -->

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
