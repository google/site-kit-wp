# `benchmarking` datastore slice on `modules/analytics-4`

## Feature Description

The Typical Traffic tab reads one response and draws every one of its sections from it. Nothing in the dashboard fetches that response yet.

This issue adds a `benchmarking` slice to the Analytics data store: a selector that returns the decoded response for a pair of dates, a loading flag, the error the request failed with, and an action that clears a stored response so it can be fetched again.

The slice decodes once. The response arrives in the benchmarking wire format, and what the store holds is the decoded object rather than the encoded one, so a re-render does not walk four hundred rows again.

**The slice keeps no cache of its own.** The plugin's API layer already stores a `GET` response in browser storage for an hour, keyed on the datapoint and its query parameters, and that is where the response lives. An hour is the right interval here: the figures move as the day accumulates, and a tab that is an hour stale on the current day while the Traffic Overview tab beside it is not would be visible to a reader comparing the two. Nothing is stored on the server, so clearing a stored response means the next request goes all the way to the reports.

**The request is keyed on the two dates rather than on the date-range name.** A response held under `last-28-days` would still be served tomorrow, when `last-28-days` means a different 28 days. Sending the dates means the key changes when the reference date rolls over.

The format this slice decodes comes from #13593, and the datapoint it requests from comes from #13594.

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* `getBenchmarkingData( startDate, endDate )` on `modules/analytics-4` returns the decoded benchmarking response — `visitors`, `dailyTraffic`, `dimensions` and `contextualData` — for that pair of dates, and returns `undefined` until the request resolves.
* Selecting `getBenchmarkingData( '2026-08-19', '2026-09-15' )` from three components in the same render issues one request to `GET:benchmarking-data`, and the three receive the same decoded object.
* Selecting the same two dates again after the first request resolves issues no further request, for the hour the API layer holds the response.
* Selecting a different pair of dates issues its own request and stores its own response, and neither pair's response replaces the other's.
* `isLoadingBenchmarkingData( startDate, endDate )` is `true` from the moment the request is issued until the response is decoded and stored, and `false` before and after.
* When the request fails, `getErrorForSelector( 'getBenchmarkingData', [ startDate, endDate ] )` returns the error the datapoint returned, carrying the status it came with, and `getBenchmarkingData` stays `undefined` for that pair of dates.
* When the response cannot be decoded — an unrecognized format version — `getBenchmarkingData` stays `undefined` for that pair of dates and an error is recorded for the selector.
* `clearBenchmarkingData( startDate, endDate )` drops the stored response for that pair of dates and the API layer's stored copy of it, so the next selection of those dates issues a new request that reaches the server.
* `clearBenchmarkingData` for one pair of dates leaves another pair's stored response in place.
* Calling `getBenchmarkingData` with a date that is not in `YYYY-MM-DD`, or with either date missing, issues no request.

## Implementation Brief

* [ ] <!-- One or more bullet points for how to technically implement the feature. Make sure to include changes to Storybook and visual regression tests where relevant. -->

### Test Coverage

* <!-- One or more bullet points for how to implement automated tests to verify the feature works. -->

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
