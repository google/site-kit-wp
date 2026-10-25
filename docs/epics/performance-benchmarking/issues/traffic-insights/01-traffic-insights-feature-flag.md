# `trafficInsights` feature flag

GitHub issue: [#13938](https://github.com/google/site-kit-wp/issues/13938)

## Feature Description

This issue adds `trafficInsights` to the plugin's list of feature flags. All Traffic Insights work is added behind this flag: the AI-generated insight on both tabs of the Traffic Overview widget (#13947, #13948), the thumbs up and down buttons on the insight (#13950), and the content markers on both charts (#13951).

Link to the design doc: https://docs.google.com/document/d/1dsEs6-NjlP_LNqz5md5fnJMuxh9Vd9f88w4DTrZdLok/edit?pli=1&tab=t.ti7yrmnh2lrv#heading=h.xai0p0vhie15 (see "Feature flag")

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* `trafficInsights` is added to the plugin's available feature flags.

## Implementation Brief

* [ ] In `feature-flags.json`:
  * Add `trafficInsights` to the array, between `rrmSurveyCTA` and `typicalTraffic`, so the list stays in alphabetical order.

### Test Coverage

* No tests required because the change only adds an entry to `feature-flags.json`, and no code reads the new flag.
* No Storybook story required because the change adds no UI.
* No VRT changes expected.

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
