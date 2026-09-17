# `googlesitekit_benchmarking_contextual_data` filter and Search Console's search-query rows

## Feature Description

One of the seven factor sections on the Typical Traffic tab is search queries: the terms that brought people to the site, with their clicks and their average position in both periods. That data belongs to Search Console, and the response it goes into is assembled by Analytics.

Analytics does not call Search Console for it. It applies a filter, `googlesitekit_benchmarking_contextual_data`, and takes whatever comes back. Search Console adds the callback that answers it, running its own reports under its own credentials and its own settings. Neither module holds a reference to the other: Analytics owns the extension point and the shape of the response, Search Console owns its reports, its connection state and its failure modes, and a module with something to contribute later adds a callback rather than an edit to the Analytics datapoint.

A search query row is not shaped like the other six dimensions. A channel or a device carries a label and two visitor counts; a query carries clicks in both periods and its average position in both, and a position that fell numerically is an improvement rather than a decline.

**A missing section is the normal case, not a failure.** Where Search Console has no property set, the key is simply absent from the response and the tab renders one section fewer. The same holds where Search Console's report fails: the request that the whole tab waits on is an Analytics request, and a Search Console failure costs one section and nothing else.

**The filter is public, so what it returns is checked rather than forwarded.** Any plugin on the site can add a callback, and any string a callback returns would be rendered in the dashboard. Analytics validates what comes back against the keys and row shapes it knows, drops what it does not recognize, and applies the same row cap it applies to the rows it derived itself. A callback that fails outright costs its own key and leaves the rest of the response intact.

The callback is added only when the `typicalTraffic` flag is enabled. Search Console is always active, so its registration always runs, and the flag check is what keeps the callback out of a request when the epic is off.

The scoring, ranking and capping the search-query rows are put through are the ones specified in #13595. Making the search-query rows reach a view-only reader is #13597.

Link to the design doc: https://docs.google.com/document/d/1dsEs6-NjlP_LNqz5md5fnJMuxh9Vd9f88w4DTrZdLok/edit?tab=t.y7e2u5h52vf1

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

* [ ] In `includes/Modules/Analytics_4/Benchmarking/Response_Builder.php`:
  * Apply the filter after the Analytics dimensions have been built and before anything is scored, so that contributed rows go through the same scoring, ranking and cap of `MAX_ROWS_PER_DIMENSION` as derived rows:

    ```php
    $contextual_data = apply_filters(
        'googlesitekit_benchmarking_contextual_data',
        $contextual_data,
        array(
            'start_date'         => $start_date,
            'end_date'           => $end_date,
            'compare_start_date' => $compare_start_date,
            'compare_end_date'   => $compare_end_date,
            'row_limit'          => Report_Options::REPORT_ROW_LIMIT,
        )
    );
    ```
  * Pass what comes back through `Contextual_Data_Validator::validate()` before anything else reads it. Never forward a callback's value straight into the response.
  * Wrap the `apply_filters()` call in a `try`/`catch` over `\Throwable`, and on a throw keep the contextual data the builder held before the call. A callback that throws costs the keys it would have added and leaves every other key in place.
  * Treat a filtered value that is not an array the same way: keep the contextual data the builder held before the call.
  * Add a PHPDoc block above the `apply_filters()` call documenting the filter, its two arguments and the row shape each key declares, so the extension point is readable from the file that owns it.

* [ ] In `includes/Modules/Analytics_4/Benchmarking/Contextual_Data_Validator.php` (new file):
  * Add `Contextual_Data_Validator` with one public method, `validate( $contextual_data )`, returning a contextual-data array that carries only keys and rows the response defines.
  * Drop any key that is not one of the values in `Wire_Format::CONTEXTUAL_DATA_KEYS`, and drop a key whose value is not a list of arrays.
  * Check each row against the fields its key declares — `label`, `current` and `previous` for `channels`, `devices`, `visitorMix`, `referrers` and `categories`; those five plus `positionCurrent` and `positionPrevious` for `searchQueries`; `url`, `title`, `visitors` and `publishedDaysAgo` for `content`. Drop a row that is missing a declared field, and drop a row whose numeric field is neither a number nor a numeric string. Keep the remaining rows of that key.
  * Cast every numeric field that survives with `(int)`, except `positionCurrent` and `positionPrevious`, which are cast with `(float)`. No string from a callback reaches the response in a field the response declares as a count or a position.
  * Cast every string field with `(string)` and drop any field the row carries that its key does not declare.

* [ ] In `includes/Modules/Search_Console/Benchmarking/Report_Options.php` (new file):
  * Add `Report_Options`, following `Search_Console\Email_Reporting\Report_Options`, with a constructor taking the four dates and the row limit, and one method returning the two `searchanalytics` request payloads — one per window — each with `dimensions` set to `query` and `rowLimit` set to the row limit the filter passed.

* [ ] In `includes/Modules/Search_Console/Benchmarking/Report_Data_Builder.php` (new file):
  * Add `Report_Data_Builder` alongside the `Email_Reporting` one, with one public method, `build_search_query_rows( array $args )`, taking the filter's second argument and returning the `searchQueries` rows, or an empty array.
  * Run the two requests through `$module->set_data( 'searchanalytics-batch', array( 'requests' => $requests ) )`, following `Email_Reporting_Data_Requests::collect_search_console_payloads()`.
  * Pair the two windows by the query string: a row holds `label` (the query), `current` and `previous` (its clicks in each window), and `positionCurrent` and `positionPrevious` (its average position in each). A query present in one window only takes `0` clicks and a `null` position for the window it is missing from.
  * Return an empty array on a `WP_Error` from the batch call, and on a batch response that carries no rows.

* [ ] In `includes/Modules/Search_Console.php`:
  * In `register()`, add the `googlesitekit_benchmarking_contextual_data` callback inside an `if ( Feature_Flags::enabled( 'typicalTraffic' ) )` block, with `10` as the priority and `2` as the accepted argument count.
  * The callback returns the contextual data untouched when `$this->get_property_id()` is empty. `Search_Console::is_connected()` is not the gate here: it returns `true` unconditionally, and the property setting is what decides whether the module has anything to report — the same check `googlesitekit_setup_complete` already makes.
  * Otherwise it builds the rows with `Report_Data_Builder` and adds them under the `searchQueries` key. It adds no key when the builder returns an empty array.
  * Wrap the body in a `try`/`catch` over `\Throwable` and return the contextual data it received on a throw, so a failure here never ends the Analytics request.

The scoring, ranking and capping these rows go through are set in #13595. Making them reach a view-only reader is #13597.

### Test Coverage

* Add `tests/phpunit/integration/Modules/Analytics_4/Benchmarking/Contextual_Data_ValidatorTest.php` covering:
  * A key the response does not define is dropped, and the rest of what the callback returned is kept.
  * A row missing a declared field is dropped and the remaining rows of that key are kept.
  * A row whose count is a non-numeric string is dropped; a row whose count is the numeric string `"12"` is kept and stored as the number `12`.
  * A `searchQueries` row's positions survive as floats, and every other numeric field survives as an integer.
  * A value that is not an array, and a key whose value is not a list of rows, each produce no key.
* Extend `tests/phpunit/integration/Modules/Analytics_4/Benchmarking/Response_BuilderTest.php` covering:
  * The filter runs with the contextual data gathered so far and a second argument holding `start_date`, `end_date`, `compare_start_date`, `compare_end_date` and `row_limit`.
  * A callback returning 40 valid rows has them ranked and cut to five, and `SEARCH_QUERIES` takes its place in `dimensions` by the sum of those rows' scores.
  * A callback that throws, returns a non-array, or returns nothing leaves every key another callback or an Analytics report contributed present and unchanged, and the request still succeeds.
* Add `tests/phpunit/integration/Modules/Search_Console/Benchmarking/Report_Data_BuilderTest.php` covering:
  * Two windows of `searchanalytics` rows pair by query into rows carrying clicks and average position for each window.
  * A query returned in one window only takes `0` clicks and a `null` position for the other.
  * A `WP_Error` from the batch call gives an empty array.
* Extend `tests/phpunit/integration/Modules/Search_ConsoleTest.php` covering:
  * With `typicalTraffic` enabled and a property set, the filter adds a `searchQueries` key.
  * With the flag off, no callback is added and the filter carries no search-query rows.
  * With no property set, the filter returns what it received and the response carries no `searchQueries` key, with every other dimension unchanged.
  * A failing Search Console report costs only the `searchQueries` key: the benchmarking request still returns `200` and `SEARCH_QUERIES` is absent from `dimensions`.
* No Storybook story is required, because the change adds no UI.
* No VRT changes expected.

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
