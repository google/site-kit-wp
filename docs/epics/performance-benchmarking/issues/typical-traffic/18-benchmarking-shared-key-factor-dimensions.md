# `landingPage` and `sessionCampaignName` among the dimensions a shared Analytics report may query

## Feature Description

Site Kit lets an administrator share a module with other roles. Readers in those roles see the dashboard without connecting a Google account of their own, and the reports run under the module owner's account. A shared Analytics report may only use the dimensions on an allow-list. #13597 makes `GET:benchmarking-data` shareable, and adds `sessionSource` to that list so a shared reader's Typical Traffic tab can show referring sites.

The design for the Key factors section has changed since #13597 was written ([Figma](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=2096-14304&m=dev)). The section now shows up to three cards. Each card names one thing that moved traffic: a channel, a landing page, a search keyword, a referring site or a campaign. To find landing pages and campaigns, the reports behind the cards (#13845) break visits down by `landingPage` and by `sessionCampaignName`. Neither dimension is on the allow-list today.

This issue adds `landingPage` and `sessionCampaignName` to the list.

**Without them, a shared reader sees an error instead of the tab.** The reports behind the response are sent in batches, and a dimension that is not on the list fails the whole batch rather than one report. So a shared reader would get the tab's error state rather than a tab with fewer cards. Adding the two dimensions is the deliberate choice over leaving landing pages and campaigns out of a shared reader's response. Leaving them out would make the response depend on which kind of user happened to load the dashboard first. A landing path and a campaign name are the same kind of data as `pagePath` and the channel grouping, which are already on the list.

**The change is outside the `typicalTraffic` flag**, like the `sessionSource` addition in #13597. The list is read on every shared report request, and what a shared report may query should not depend on a feature flag. With the flag off, nothing in the Typical Traffic tab uses the two dimensions.

Link to the design doc: https://docs.google.com/document/d/1dsEs6-NjlP_LNqz5md5fnJMuxh9Vd9f88w4DTrZdLok/edit?tab=t.y7e2u5h52vf1

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* On a site where an administrator has shared Analytics with the Editor role, an Analytics report requested by an editor who has not connected a Google account, with `landingPage` or `sessionCampaignName` among its dimensions, returns its rows under the Analytics owner's account rather than the error `Unsupported dimensions requested`.
* The same holds with `typicalTraffic` enabled and with it disabled.
* A shared report requesting a dimension that is still not on the list, such as `landingPagePlusQueryString`, still returns the error `Unsupported dimensions requested: landingPagePlusQueryString`.
* Every dimension already on the list stays on it, and a shared report requesting only those dimensions returns the same rows as before.

## Implementation Brief

* [ ] In `includes/Modules/Analytics_4/Report/RequestHelpers.php`:
  * Add `landingPage` and `sessionCampaignName` to the default array `validate_shared_dimensions()` passes through the `googlesitekit_shareable_analytics_4_dimensions` filter, `landingPage` beside `pagePath` and `sessionCampaignName` beside `sessionDefaultChannelGrouping`.
  * Leave the additions outside any feature-flag check.

`sessionSource` and the rest of the shared Typical Traffic tab are #13597, and the reports that query the two dimensions are #13845.

### Test Coverage

* Add a case to `tests/phpunit/integration/Modules/Analytics_4Test.php`, following `test_validate_shared_dimensions__accepts_new_custom_event_dimensions()`, covering:
  * `validate_shared_dimensions()` accepts `landingPage` and `sessionCampaignName`, with and without `typicalTraffic` enabled.
* Extend `test_report__shared_dimension_validation()` in the same file covering:
  * A shared report requesting `landingPagePlusQueryString` still fails with `Unsupported dimensions requested: landingPagePlusQueryString`.
* No Storybook story is required, because the change adds no UI.
* No VRT changes expected.

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
