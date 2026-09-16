# `typicalTraffic` feature flag

## Feature Description

The Typical Traffic tab is built across eleven separate pieces of work: a new Analytics datapoint, the reports and arithmetic behind it, a filter Search Console answers, a transport format, a datastore slice, and the tab itself with its chart and its factor sections. None of that should reach a dashboard until all of it is ready, and Site Kit stages work like this behind a feature flag. The epic has no flag yet.

This issue adds `typicalTraffic` to the plugin's list of feature flags, and nothing else. It changes nothing a user sees. The flag is the switch every later piece of the epic is added under: the tab is added to the Traffic Overview widget's tab list under the flag check, the `GET:benchmarking-data` datapoint is registered under it, and Search Console adds its contextual-data callback under it. With the flag off, the Traffic Overview widget carries the one tab it carries today, and neither Analytics nor Search Console carries any benchmarking code into a request.

The flag has to be readable on both sides of the plugin, because the epic adds work on both. PHP reads it before registering the datapoint and the callback; the dashboard reads it before adding the tab.

Two changes the epic makes are deliberately left outside the flag, and they are specified with the work that makes them rather than here: `sessionSource` is added to the list of dimensions a shared report may query, and `propertyCreateTime` is added to the Analytics settings a view-only dashboard receives. Both are single entries in allow-lists that the rest of the plugin reads on every request, and what a shared report may query should not depend on a feature flag.

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* `typicalTraffic` is one of the plugin's available feature flags, so it can be turned on for a site the same way every other flag is.
* When the flag is enabled, `Feature_Flags::enabled( 'typicalTraffic' )` returns `true` on the server and `useFeature( 'typicalTraffic' )` returns `true` in the dashboard.
* When the flag is not enabled, both return `false`.
* Enabling the flag changes nothing on the main dashboard or the entity dashboard: the Traffic Overview widget renders the same tab bar, the same panel and the same footer link as it does with the flag off.

## Implementation Brief

* [ ] <!-- One or more bullet points for how to technically implement the feature. Make sure to include changes to Storybook and visual regression tests where relevant. -->

### Test Coverage

* <!-- One or more bullet points for how to implement automated tests to verify the feature works. -->

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
