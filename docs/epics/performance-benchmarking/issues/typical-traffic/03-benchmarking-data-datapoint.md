# `GET:benchmarking-data` on Analytics — the datapoint the Typical Traffic tab requests

## Feature Description

Everything the Typical Traffic tab draws comes from seven reports across two Google services: thirteen months of daily visitors, the site's totals for the selected period and the one before it, and six ranked lists of the values that moved. Issuing those from the browser would be eight requests to compose one view, one of which belongs to Search Console and would be sent from inside an Analytics widget. It would also put the arithmetic that decides what a reader sees first in the component that renders it.

This issue adds the single request the tab makes instead: `GET:benchmarking-data` on the Analytics module. Its only parameters are the two dates the dashboard already has, and it returns everything the tab draws, encoded in the benchmarking wire format. One request means the tab has one loading state and one error state, and its sections fill in together rather than one at a time.

The datapoint is registered only when the `typicalTraffic` flag is enabled, so with the flag off Analytics carries no benchmarking code into a request.

It declares its own permission check, and the capability it checks is the one for viewing the dashboard rather than the one for the authenticated dashboard, so a view-only user reaches it. Left to the default for a read datapoint it would inherit a broader check; declaring it is what makes the check correct rather than merely permissive.

The datapoint takes no URL parameter. The analysis is a whole-site one, so there is no per-page version of it to ask for, and the response for a pair of dates is the same wherever in the dashboard it is requested from.

This issue wires the request: where the datapoint is registered, what it accepts, who may call it, what it returns and how it fails. Running the reports and deriving the response is separate work — see #13595. The format the response is encoded in comes from #13593, and making the datapoint answer a shared request is #13597.

Link to the design doc: https://docs.google.com/document/d/1dsEs6-NjlP_LNqz5md5fnJMuxh9Vd9f88w4DTrZdLok/edit?tab=t.y7e2u5h52vf1

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* With `typicalTraffic` enabled, a `GET` to `/google-site-kit/v1/modules/analytics-4/data/benchmarking-data?startDate=2026-08-19&endDate=2026-09-15` returns HTTP `200` and the benchmarking response encoded in the wire format.
* With `typicalTraffic` not enabled, the same request returns HTTP `400` with the error code `invalid_datapoint`, and no report is run.
* `startDate` and `endDate` are the only parameters the response depends on: two requests that differ in any other query parameter, with the same two dates, return the same response.
* A request that omits `startDate`, omits `endDate`, or gives either date in a format other than `YYYY-MM-DD` returns HTTP `400`, and no report is run.
* A request whose `startDate` is later than its `endDate` returns HTTP `400`, and no report is run.
* A user who can view the Site Kit dashboard reaches the datapoint. A user who cannot returns HTTP `403` and no report is run.
* When a Google Analytics report behind the response fails, the request returns the error Analytics gave, with that error's status, and no part of a response beside it.
* The response is assembled inside the request that asks for it and nothing about it is written to the site: two identical requests each run their reports, and no option, transient or post meta is added or changed by either.

## Implementation Brief

* [ ] In `includes/Modules/Analytics_4/Datapoints/Get_Benchmarking_Data.php` (new file):
  * Add `Get_Benchmarking_Data extends Shareable_Datapoint implements Executable_Datapoint, Permission_Aware_Datapoint`, taking `module`, `settings` and `context` through its `$definition` array, following `Get_Batch_Report`.
  * `create_request( Data_Request $data )` reads `startDate` and `endDate` and nothing else from the request. It throws `Missing_Required_Param_Exception` for either one that is empty, the way `Batch_Search_Analytics::create_request()` does, which gives HTTP `400`.
  * It returns a `WP_Error` with the code `invalid_param` and the status `400` when either date does not match `YYYY-MM-DD`, or when `startDate` is later than `endDate`. Check the format with a regular expression and `checkdate()`, so `2026-13-45` is rejected rather than parsed.
  * On valid dates it returns a closure. The closure calls `Response_Builder::build( $start_date, $end_date )`, returns that value unchanged when it is a `WP_Error`, and otherwise returns `Response_Encoder::encode()` over it.
  * `parse_response()` returns the response unchanged.
  * `permission_callback()` returns `current_user_can( Permissions::VIEW_DASHBOARD )`, following `Get_Form_Metadata`. Do not use `VIEW_AUTHENTICATED_DASHBOARD`: a view-only reader has to reach this datapoint.
  * The datapoint declares no scopes of its own and takes no `url` parameter.

* [ ] In `includes/Modules/Analytics_4/Benchmarking/Response_Builder.php` (new file):
  * Add `Response_Builder` with a constructor taking the module instance and `Context`, and one public method, `build( $start_date, $end_date )`, returning the four response fields — `visitors`, `dailyTraffic`, `dimensions` and `contextualData` — or a `WP_Error` from a failed report.
  * The reports and the arithmetic behind the four fields are #13595. This issue adds the class and wires the datapoint to it, so that the parameter, permission and failure behavior above is reachable end to end.

* [ ] In `includes/Modules/Analytics_4.php`:
  * Add `GET:benchmarking-data` to `get_datapoint_definitions()`, inside an `if ( Feature_Flags::enabled( 'typicalTraffic' ) )` block, following how `Reader_Revenue_Manager::get_datapoint_definitions()` adds its datapoints under `rrmExpressSetup`.
  * Pass the datapoint `'service' => function () { return $this->get_service( 'analyticsdata' ); }`, `'settings' => $this->get_settings()` and `'context' => $this->context`.
  * Nothing is written to the site while the response is assembled: the builder reads reports and returns an array, and no option, transient or post meta is touched.

The format the response is encoded in comes from #13593. Making the datapoint answer a shared request is #13597.

### Test Coverage

* Add `tests/phpunit/integration/Modules/Analytics_4/Datapoints/Get_Benchmarking_DataTest.php` covering:
  * With `typicalTraffic` enabled, a `GET` to `/google-site-kit/v1/modules/analytics-4/data/benchmarking-data` with `startDate=2026-08-19` and `endDate=2026-09-15` returns `200` and the encoded response.
  * With the flag off, the same request returns `400` with the code `invalid_datapoint`, and the builder is never called.
  * A request missing `startDate`, a request missing `endDate`, a request whose dates are not `YYYY-MM-DD`, and a request whose `startDate` is later than its `endDate` each return `400` with no report run.
  * Two requests with the same two dates and a different third query parameter return the same response.
  * A user who can view the dashboard reaches the datapoint; a user who cannot gets `403` with no report run.
  * A `WP_Error` from the builder is returned with its own code and status, and no partial response beside it.
  * Two identical requests each run their reports, and neither adds or changes an option or a transient.
* Extend `tests/phpunit/integration/Modules/Analytics_4Test.php` covering:
  * `get_datapoints()` names `benchmarking-data` with `typicalTraffic` enabled and does not name it with the flag off.
* No Storybook story is required, because the change adds no UI.
* No VRT changes expected.

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
