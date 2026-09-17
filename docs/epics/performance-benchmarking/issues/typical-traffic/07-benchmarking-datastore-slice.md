# `benchmarking` datastore slice on `modules/analytics-4`

## Feature Description

The Typical Traffic tab reads one response and draws every one of its sections from it. Nothing in the dashboard fetches that response yet.

This issue adds a `benchmarking` slice to the Analytics data store: a selector that returns the decoded response for a pair of dates, a loading flag, the error the request failed with, and an action that clears a stored response so it can be fetched again.

The slice decodes once. The response arrives in the benchmarking wire format, and what the store holds is the decoded object rather than the encoded one, so a re-render does not walk four hundred rows again.

**The slice keeps no cache of its own.** The plugin's API layer already stores a `GET` response in browser storage for an hour, keyed on the datapoint and its query parameters, and that is where the response lives. An hour is the right interval here: the figures move as the day accumulates, and a tab that is an hour stale on the current day while the Traffic Overview tab beside it is not would be visible to a reader comparing the two. Nothing is stored on the server, so clearing a stored response means the next request goes all the way to the reports.

**The request is keyed on the two dates rather than on the date-range name.** A response held under `last-28-days` would still be served tomorrow, when `last-28-days` means a different 28 days. Sending the dates means the key changes when the reference date rolls over.

The format this slice decodes comes from #13593, and the datapoint it requests from comes from #13594.

Link to the design doc: https://docs.google.com/document/d/1dsEs6-NjlP_LNqz5md5fnJMuxh9Vd9f88w4DTrZdLok/edit?tab=t.y7e2u5h52vf1

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

* [ ] In `assets/js/modules/analytics-4/datastore/benchmarking.ts` (new file), following `advanced-data-breakdowns.ts` for how a TypeScript slice is typed and combined:
  * Hold the decoded responses in state under `benchmarkingData`, a map keyed by `` `${ startDate }::${ endDate }` ``, so one pair of dates never replaces another's.
  * Add one `createFetchStore` with `baseName: 'getBenchmarkingData'`, `argsToParams: ( startDate: string, endDate: string ) => ( { startDate, endDate } )`, and a `validateParams` that asserts both dates are present and pass `isValidDateString` from `@/js/util`. A call with a missing or badly formatted date therefore issues no request.
  * Its `controlCallback` calls `get( 'modules', MODULE_SLUG_ANALYTICS_4, 'benchmarking-data', { startDate, endDate }, { cacheTTL: HOUR_IN_SECONDS } )`, then returns `decodeBenchmarkingResponse()` over the result. When the decoder returns `null`, reject with an error object carrying the code `benchmarking_decode_failed`, a translated message and `data: { status: 500 }`. `createFetchStore` turns a rejected control into `setErrorForSelector( error, 'getBenchmarkingData', args )` and stores nothing, which is what keeps the selector `undefined` after a failure.
  * Its `reducerCallback` writes the decoded object under the key for its two dates. The store holds the decoded object, never the encoded one, so a re-render does not decode the rows again.
  * `getBenchmarkingData( state, startDate, endDate )` returns the decoded object for that key, or `undefined`.
  * Its resolver reads the current value first and returns without fetching when it is already there; otherwise it calls `fetchGetBenchmarkingData( startDate, endDate )`. Keying the resolver on the two dates is what makes three components selecting the same pair in one render issue one request.
  * `isLoadingBenchmarkingData( state, startDate, endDate )` is a registry selector returning `true` when `isFetchingGetBenchmarkingData( { startDate, endDate } )` is `true` or `isResolving( 'getBenchmarkingData', [ startDate, endDate ] )` is `true`, and `false` otherwise.
  * `clearBenchmarkingData( startDate, endDate )` is an action created with `createValidatedAction`, validating its two dates the same way. It dispatches a `CLEAR_BENCHMARKING_DATA` action that deletes that one key from state, calls `invalidateResolution( 'getBenchmarkingData', [ startDate, endDate ] )`, and deletes the API layer's entry for those dates only with `deleteItem( createCacheKey( 'modules', MODULE_SLUG_ANALYTICS_4, 'benchmarking-data', { startDate, endDate } ) )`, importing `deleteItem` from `@/js/googlesitekit/api/cache` and `createCacheKey` from `googlesitekit-api`.
  * Do not use `invalidateCache( 'modules', 'analytics-4', 'benchmarking-data' )` here: it drops every stored response for the datapoint, including the other pairs of dates this action must leave alone.
  * The slice keeps no expiry of its own. The API layer's hour is the only one.

* [ ] In `assets/js/modules/analytics-4/datastore/index.js`:
  * Import the slice as `benchmarking` and add it to the `combineStores()` call, in the alphabetical position the existing imports keep.

* [ ] In `assets/js/modules/analytics-4/datastore/__factories__/benchmarking.ts` (new file):
  * Export `decodedBenchmarkingResponse`, the result of `decodeBenchmarkingResponse()` over the checked-in `benchmarking-data.json` fixture, so tests and stories share one decoded object with the encoder's.
  * Export `provideBenchmarkingData( registry, { startDate, endDate }, response = decodedBenchmarkingResponse )`, which dispatches `receiveGetBenchmarkingData( response, { startDate, endDate } )` and finishes the resolution, so a test or a story renders without sending a request.
  * Re-export both from `assets/js/modules/analytics-4/datastore/__factories__/index.js`.

The format this slice decodes comes from #13593, and the datapoint it requests from comes from #13594.

### Test Coverage

* Add `assets/js/modules/analytics-4/datastore/benchmarking.test.ts` covering the `getBenchmarkingData` and `isLoadingBenchmarkingData` selectors and the `clearBenchmarkingData` action:
  * `getBenchmarkingData` is `undefined` until the request resolves, then returns the four decoded fields for that pair of dates.
  * Selecting the same two dates from three places in one render issues one request, and all three receive the same object.
  * Selecting the same dates again after the request resolves issues no further request.
  * Two different pairs of dates each issue a request and each keep their own response.
  * `isLoadingBenchmarkingData` is `false` before anything selects the dates, `true` while the request is in flight, and `false` once the response is stored.
  * A failed request records the datapoint's error, with its status, under `getErrorForSelector( 'getBenchmarkingData', [ startDate, endDate ] )`, and leaves `getBenchmarkingData` `undefined`.
  * A response whose format version the decoder does not recognize records an error for the selector and leaves `getBenchmarkingData` `undefined`.
  * `clearBenchmarkingData` drops the stored response and the API layer's entry for those dates, so the next selection reaches the network, and leaves another pair's stored response and cache entry in place.
  * `getBenchmarkingData` with a date that is not `YYYY-MM-DD`, and with either date missing, issues no request.
* No Storybook story is required, because the change adds no UI. `provideBenchmarkingData` is what the stories in #13599, #13600, #13601 and #13602 use.
* No VRT changes expected.

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
