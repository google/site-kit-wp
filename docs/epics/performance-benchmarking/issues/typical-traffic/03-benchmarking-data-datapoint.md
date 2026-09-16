# `GET:benchmarking-data` on Analytics — the datapoint the Typical Traffic tab requests

## Feature Description

Everything the Typical Traffic tab draws comes from seven reports across two Google services: thirteen months of daily visitors, the site's totals for the selected period and the one before it, and six ranked lists of the values that moved. Issuing those from the browser would be eight requests to compose one view, one of which belongs to Search Console and would be sent from inside an Analytics widget. It would also put the arithmetic that decides what a reader sees first in the component that renders it.

This issue adds the single request the tab makes instead: `GET:benchmarking-data` on the Analytics module. Its only parameters are the two dates the dashboard already has, and it returns everything the tab draws, encoded in the benchmarking wire format. One request means the tab has one loading state and one error state, and its sections fill in together rather than one at a time.

The datapoint is registered only when the `typicalTraffic` flag is enabled, so with the flag off Analytics carries no benchmarking code into a request.

It declares its own permission check, and the capability it checks is the one for viewing the dashboard rather than the one for the authenticated dashboard, so a view-only user reaches it. Left to the default for a read datapoint it would inherit a broader check; declaring it is what makes the check correct rather than merely permissive.

The datapoint takes no URL parameter. The analysis is a whole-site one, so there is no per-page version of it to ask for, and the response for a pair of dates is the same wherever in the dashboard it is requested from.

This issue wires the request: where the datapoint is registered, what it accepts, who may call it, what it returns and how it fails. Running the reports and deriving the response is separate work — see #13595. The format the response is encoded in comes from #13593, and making the datapoint answer a shared request is #13597.

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

* [ ] <!-- One or more bullet points for how to technically implement the feature. Make sure to include changes to Storybook and visual regression tests where relevant. -->

### Test Coverage

* <!-- One or more bullet points for how to implement automated tests to verify the feature works. -->

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
