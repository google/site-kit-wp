# `POST:benchmarking-insight-feedback` — send a vote on one part of the insight

GitHub issue: [#13949](https://github.com/google/site-kit-wp/issues/13949)

## Feature Description

Readers are going to rate each part of the generated insight with a thumbs up or a thumbs down (#13950). A vote on AI-generated text must go to the Site Kit Service's `/v1/ai/feedback` endpoint, linked to the generation that wrote the text. The service keeps the vote next to its own record of that generation, so the team can see which generations readers disliked. This issue adds a `Google_Proxy` method for this endpoint, and the `POST:benchmarking-insight-feedback` datapoint that sends one vote.

A vote has the generation's `interactionID` and `scenario`, the part that was rated (`surface`: `teaser`, `text` or `driver`), the `sentiment`, and optional reason tokens. The datapoint adds `feature: 'benchmarking'`, the user's language and a timestamp. It checks the vote the way the service does, so a bad vote fails in the plugin. It keeps no copy of the service's lists of scenarios and reasons, so a value that the service adds later is not refused.

This datapoint is not shareable, and only a user of the authenticated dashboard can use it. So a vote never leaves the site in the Analytics owner's name.

The service does not store `surface` yet. It ignores fields that it does not know, so sending `surface` now causes no error. The exact name and values of this field are still an open question.

Link to the design doc: https://docs.google.com/document/d/1dsEs6-NjlP_LNqz5md5fnJMuxh9Vd9f88w4DTrZdLok/edit?pli=1&tab=t.ti7yrmnh2lrv#heading=h.xai0p0vhie15 (see "Insight feedback", "Insight datapoints" and "Request and response field mapping")

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* With `trafficInsights` enabled, `POST /google-site-kit/v1/modules/analytics-4/data/benchmarking-insight-feedback` with `{ "data": { "interactionID", "scenario", "surface", "sentiment", "reasons" } }` sends the vote to `/v1/ai/feedback` and returns `{ success: true }`.
* The request to the service has the `Authorization: Bearer <access token>` header and a JSON body with `site_id`, `site_secret`, `interaction_id`, `feature: 'benchmarking'`, `scenario_code`, `surface`, `sentiment`, `locale`, `client_timestamp` in RFC 3339 format, and `reasons` when the vote has reasons. The body has no `comment`.
* `locale` is the user's language as a tag with a hyphen and no variant: `de-DE` for `de_DE_formal`.
* The datapoint returns a `400` error, and sends nothing to the service, when:
  * `interactionID` is not a 26-character ULID,
  * `sentiment` is not `POSITIVE` or `NEGATIVE`,
  * `surface` is not `teaser`, `text` or `driver`,
  * there are more than five `reasons`.
* A `scenario` or a reason token that the plugin does not know, such as `NEW_SCENARIO`, is sent to the service unchanged.
* When the service answers with `400`, `403` or `500`, the datapoint returns a `WP_Error` with the same status.
* A user who views a shared dashboard without their own Google account gets a `403` error, and nothing is sent to the service. So does an administrator who has not connected Site Kit.
* With `trafficInsights` disabled, the request returns the `invalid_datapoint` error.

## Implementation Brief

* [ ] <!-- One or more bullet points for how to technically implement the feature. Make sure to include changes to Storybook and visual regression tests where relevant. -->

### Test Coverage

* <!-- One or more bullet points for how to implement automated tests to verify the feature works. -->

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
