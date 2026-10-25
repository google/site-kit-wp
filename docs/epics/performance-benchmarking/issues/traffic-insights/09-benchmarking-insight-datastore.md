# `benchmarking` datastore slice — get the generated insight and wait for it

GitHub issue: [#13946](https://github.com/google/site-kit-wp/issues/13946)

## Feature Description

Both tabs of the Traffic Overview widget show the same generated insight. This issue adds `getBenchmarkingInsight( endDate )` to the `benchmarking` slice (#13598). Its resolver takes the payload (#13943) from the data response, submits it with `POST:benchmarking-insight` (#13940), and then reads the generation with `GET:benchmarking-insight` every two seconds until the insight is ready.

The insight always covers the 28 days that end on `endDate`. On `Last 28 days`, the payload comes from the panel's own data request. On any other range, the slice also requests the data for those 28 days.

**A mistake here looks correct on screen, but it can cost the site its generations.** The service limits how many generations each site and user can start: 10, then 2 more each hour, and no more than 20 a day for each site. Reading a generation is free, but a submit can start a new one. So the slice submits as rarely as possible:

* It keeps the result in its own browser cache entry, keyed by the end date and the locale. The API layer cannot cache it, because the submit is a `POST` and the read's answer changes while its parameters stay the same. An insight is kept for a day, and a `429` or `403` for an hour. While a generation runs, the entry keeps its operation ID for an hour, so a reload continues to read the same generation.
* The entry is stored outside the datapoint's cache group, because every submit clears that whole group.
* It submits again only when the service's rules say so: five seconds after a `409` or `503`, and once after a lost generation.
* It stops waiting at a deadline. The generation continues in the service, and the next mount gets it from the service's cache. The length of the deadline is still an open question. It is at most about 40 seconds.

Link to the design doc: https://docs.google.com/document/d/1dsEs6-NjlP_LNqz5md5fnJMuxh9Vd9f88w4DTrZdLok/edit?pli=1&tab=t.ti7yrmnh2lrv#heading=h.xai0p0vhie15 (see "Datastore slice", "Waiting for the generation" and "Browser-side caching")

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* `getBenchmarkingInsight( '2026-09-15' )` returns `{ scenario, teaser, text, driver, interactionID, modelVersion }` when the insight arrives, and `undefined` before that.
* For a generation that is `RUNNING` on the first 3 reads, the slice sends 1 submit and 4 reads, two seconds apart.
* When the submit returns the insight, no read is sent.
* `isLoadingBenchmarkingInsight( '2026-09-15' )` is `true` from the first request until the insight or a failure is stored, also between two reads.
* Every outcome other than an insight is in `getErrorForSelector( 'getBenchmarkingInsight', [ '2026-09-15' ] )`, with the status that the datapoint returned. A passed deadline is recorded there too.
* When the data response has no payload, or the data request fails, no submit is sent, `isLoadingBenchmarkingInsight` is `false`, and no insight is returned.
* When the browser cache has the insight for the end date and the locale, selecting it sends no request.
* After a `429` or a `403`, selecting the insight again within the hour sends no request and returns the same error. After the hour, it sends 1 submit.
* A reload during a generation sends a read for the stored operation ID, and no submit.
* A read answered with `404`, or an operation `FAILED` with code `503`, leads to exactly 1 new submit. If the new generation is lost too, the slice stops. An operation `FAILED` with code `500` stops at once, with no new submit.
* A submit answered with `409` or `503` is sent again five seconds later, until the deadline.
* A stored operation that is still `RUNNING` two minutes after its submit leads to 1 new submit, and no more reads of the old operation.
* After the deadline, no more reads are sent.
* The Traffic Overview panel and the Typical Traffic panel selecting the insight one after the other send 1 submit.
* With `Last 90 days` ending on `2026-09-15` selected, the slice requests the data for `2026-08-19` to `2026-09-15` and submits that payload. Switching to `Last 28 days` sends no second submit.
* When the figures change within the day and the payload changes with them, the stored insight for the same end date and locale is still used, and no submit is sent.
* A submit for `2026-09-15` leaves the stored insight for `2026-09-14` in place.
* `clearBenchmarkingData( startDate, endDate )` also removes the insight, the operation ID and the browser cache entry for `endDate`. The next selection sends a new submit.

## Implementation Brief

* [ ] <!-- One or more bullet points for how to technically implement the feature. Make sure to include changes to Storybook and visual regression tests where relevant. -->

### Test Coverage

* <!-- One or more bullet points for how to implement automated tests to verify the feature works. -->

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
