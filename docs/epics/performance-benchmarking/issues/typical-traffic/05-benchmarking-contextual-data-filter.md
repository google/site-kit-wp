# `googlesitekit_benchmarking_contextual_data` filter and Search Console's search-query rows

## Feature Description

One of the seven factor sections on the Typical Traffic tab is search queries: the terms that brought people to the site, with their clicks and their average position in both periods. That data belongs to Search Console, and the response it goes into is assembled by Analytics.

Analytics does not call Search Console for it. It applies a filter, `googlesitekit_benchmarking_contextual_data`, and takes whatever comes back. Search Console adds the callback that answers it, running its own reports under its own credentials and its own settings. Neither module holds a reference to the other: Analytics owns the extension point and the shape of the response, Search Console owns its reports, its connection state and its failure modes, and a module with something to contribute later adds a callback rather than an edit to the Analytics datapoint.

A search query row is not shaped like the other six dimensions. A channel or a device carries a label and two visitor counts; a query carries clicks in both periods and its average position in both, and a position that fell numerically is an improvement rather than a decline.

**A missing section is the normal case, not a failure.** Where Search Console has no property set, the key is simply absent from the response and the tab renders one section fewer. The same holds where Search Console's report fails: the request that the whole tab waits on is an Analytics request, and a Search Console failure costs one section and nothing else.

**The filter is public, so what it returns is checked rather than forwarded.** Any plugin on the site can add a callback, and any string a callback returns would be rendered in the dashboard. Analytics validates what comes back against the keys and row shapes it knows, drops what it does not recognize, and applies the same row cap it applies to the rows it derived itself. A callback that fails outright costs its own key and leaves the rest of the response intact.

The callback is added only when the `typicalTraffic` flag is enabled. Search Console is always active, so its registration always runs, and the flag check is what keeps the callback out of a request when the epic is off.

The scoring, ranking and capping the search-query rows are put through are the ones specified in #13595. Making the search-query rows reach a view-only reader is #13597.

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* While assembling the benchmarking response, Analytics applies the `googlesitekit_benchmarking_contextual_data` filter, passing the contextual data gathered so far and a second argument carrying `start_date`, `end_date`, `compare_start_date`, `compare_end_date` and `row_limit`.
* With `typicalTraffic` enabled and Search Console holding a property, the filtered response carries a `searchQueries` key whose rows each hold `label`, `current`, `previous`, `positionCurrent` and `positionPrevious` — the query, its clicks in the selected and comparison periods, and its average position in each.
* `searchQueries` carries at most **5** rows, ranked by the same score as every other dimension, and `SEARCH_QUERIES` takes its place in `dimensions` by the sum of those rows' scores.
* With `typicalTraffic` not enabled, no callback is added and the filter carries no search-query rows.
* When Search Console holds no property, the response carries no `searchQueries` key, `SEARCH_QUERIES` is absent from `dimensions`, and every other dimension is present and unchanged.
* When Search Console's report fails, the response carries no `searchQueries` key, `SEARCH_QUERIES` is absent from `dimensions`, the request still returns HTTP `200`, and every other dimension is present and unchanged.
* A callback that throws, returns something other than an array, or returns nothing costs only the keys it would have added: the request returns HTTP `200` and every key contributed by another callback or derived from an Analytics report is present and unchanged.
* A callback that adds a key the response does not define has that key dropped, and the rest of what it returned is kept.
* A callback that returns a row missing a field its key declares, or a field whose value is not a number where a number is declared, has that row dropped and the remaining rows of that key kept.
* A callback that returns 40 rows for a key has them ranked and cut to **5**, the same as rows derived from an Analytics report.
* A callback that returns a number where an integer is declared, or a numeric string, has it stored as a number: no string from a callback reaches the response in a field the response declares as a count or a position.

## Implementation Brief

* [ ] <!-- One or more bullet points for how to technically implement the feature. Make sure to include changes to Storybook and visual regression tests where relevant. -->

### Test Coverage

* <!-- One or more bullet points for how to implement automated tests to verify the feature works. -->

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
