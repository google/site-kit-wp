# Benchmarking response — the reports behind the insight request and the content markers

GitHub issue: [#13942](https://github.com/google/site-kit-wp/issues/13942)

## Feature Description

The insight request sends the service more data than the Typical Traffic tab uses (#13845). This issue adds the reports that collect this data. Turning their rows into the request is done in #13943, and turning them into the content markers is done in #13945.

**Analytics.** Three new reports run in one batch call. A content report gives sessions for each page that has a post date. It runs on every range where the post date custom dimension has data, because the content markers need it on every range. A top pages report gives the 20 most visited pages. A channel × `landingPagePlusQueryString` report gives sessions by channel and landing page, with the query string. The service reads click identifiers, such as `gclid`, from the query string. On a 28-day range, the daily report also starts earlier, about 420 days back, so the request can compare this year's change with last year's.

**Search Console.** When the flag is enabled, Search Console's callback also adds each query's average position and the site's total clicks in each 28-day window. It adds them in the batch call that it already makes.

**Sharing.** A shared report that uses a dimension outside an allow-list fails, and it fails the whole response with it. So `landingPagePlusQueryString` is added to that list, outside the flag, like `landingPage` and `sessionCampaignName` in #13843.

Link to the design doc: https://docs.google.com/document/d/1dsEs6-NjlP_LNqz5md5fnJMuxh9Vd9f88w4DTrZdLok/edit?pli=1&tab=t.ti7yrmnh2lrv#heading=h.xai0p0vhie15 (see "Payload assembly", "Dashboard sharing" and "Contextual data additions")

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* With `trafficInsights` enabled and data in the post date custom dimension, every `GET:benchmarking-data` request also runs a content report: sessions by `pagePath`, `pageTitle` and `customEvent:googlesitekit_post_date`, for pages that have a post date. Without data in the post date dimension, this report does not run.
* With `trafficInsights` enabled, a request for 28 days also runs, in the same batch call as the content report:
  * a report of sessions by `pagePath` over the 28 days, with no filter, sorted from most to fewest sessions, limited to 20 rows;
  * a report of sessions by `sessionDefaultChannelGrouping` and `landingPagePlusQueryString`, over the 28 days and the 28 days before them.
* With `trafficInsights` enabled, the daily report for a 28-day request ending on `2026-09-15` starts on `2025-07-22`: 55 days before `2025-09-15`. The daily report for other ranges starts on the same day as before.
* With `trafficInsights` enabled and Search Console connected, the Search Console rows passed through `googlesitekit_benchmarking_contextual_data` have:
  * `positionCurrent` and `positionPrevious` on each search keyword row: the query's average position in each window, or `null` for a window in which the query does not appear;
  * `searchClicks`: `{ current, previous }`, the site's total clicks in each window.
* On a site where Analytics is shared with the Editor role, a report with `landingPagePlusQueryString` that an editor without their own Google account requests returns its rows under the Analytics owner's account. This works with `trafficInsights` enabled and disabled.
* With `trafficInsights` disabled, `GET:benchmarking-data` sends the same reports and returns the same response as before.

## Implementation Brief

* [ ] <!-- One or more bullet points for how to technically implement the feature. Make sure to include changes to Storybook and visual regression tests where relevant. -->

### Test Coverage

* <!-- One or more bullet points for how to implement automated tests to verify the feature works. -->

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
