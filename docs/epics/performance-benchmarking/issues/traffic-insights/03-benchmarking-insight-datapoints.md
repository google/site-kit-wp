# `POST:benchmarking-insight` and `GET:benchmarking-insight` — submit the insight request and read the generation

GitHub issue: [#13940](https://github.com/google/site-kit-wp/issues/13940)

## Feature Description

The dashboard needs two requests to get the generated insight. One sends the insight request to the Site Kit Service. The other reads the generation until it is finished. This issue adds two Analytics datapoints for these requests. They call the two new `Google_Proxy` methods for the generative endpoint (#13939). They run no report.

`POST:benchmarking-insight` takes the encoded payload (#13943) that `GET:benchmarking-data` (#13594) returns, in the request body. A body is used because the payload can be longer than the URL length that many web servers allow. The payload passes through the browser, so a dashboard user can change it by hand. For this reason, the datapoint checks the decoded payload like any other request body before it sends it.

`GET:benchmarking-insight` takes the `operationID` that the submit returned, and returns the state of that generation.

Both datapoints work on the view-only dashboard (#13597), so a shared reader also gets the generated text. On a shared request, they use the Analytics owner's account, like shared reports do. Each failure is a `WP_Error` whose status tells the dashboard what to do next: wait and try again, submit again once, or stop.

Link to the design doc: https://docs.google.com/document/d/1dsEs6-NjlP_LNqz5md5fnJMuxh9Vd9f88w4DTrZdLok/edit?pli=1&tab=t.ti7yrmnh2lrv#heading=h.xai0p0vhie15 (see "Insight datapoints", "Sanitization responsibilities" and "Datapoint response shapes")

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* With `trafficInsights` enabled, `POST /google-site-kit/v1/modules/analytics-4/data/benchmarking-insight` with `{ "data": { "payload": "<encoded payload>" } }` sends the decoded payload to the service and returns one of:
  * `{ operationID }`, when the service started a generation or joined one that is already running.
  * `{ insight: { scenario, teaser, text, driver, interactionID, modelVersion } }`, when the service answered from its cache. `teaser` is absent when the service wrote no teaser.
* `GET /google-site-kit/v1/modules/analytics-4/data/benchmarking-insight?operationID=<operation ID>` returns `{ done, state }`, where `state` is `RUNNING`, `SUCCEEDED` or `FAILED`. When `state` is `SUCCEEDED`, it also returns `insight` with the fields above.
* The submit returns a `400` error, and sends nothing to the service, when the payload:
  * cannot be decoded,
  * has a field that the payload format does not define,
  * has a row with a missing or extra field, or a value of the wrong type,
  * has a longer string, or more rows, than the encoder allows.
* Failures are `WP_Error`s with these statuses:

  | What happened | Status |
  | :---- | :---- |
  | The service refused the submit with `400`, `403`, `409`, `429` or `503` | The same status |
  | The service answered the read with `403` or `404` | The same status |
  | The operation is `FAILED` with code `503` | `503` |
  | The operation is `FAILED` with code `500` | `500`, with the service's message |
  | Any other `5xx` from the service, or a transport error | `500` |

* A user who views a shared dashboard without their own Google account can use both datapoints, and the service receives the Analytics owner's access token.
* When the Analytics owner is disconnected, a shared request returns an error and sends nothing to the service.
* When the access token has expired, it is refreshed before the request is sent.
* With `trafficInsights` disabled, both requests return the `invalid_datapoint` error.

## Implementation Brief

* [ ] <!-- One or more bullet points for how to technically implement the feature. Make sure to include changes to Storybook and visual regression tests where relevant. -->

### Test Coverage

* <!-- One or more bullet points for how to implement automated tests to verify the feature works. -->

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
