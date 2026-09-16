# Typical Traffic on a shared dashboard — make `GET:benchmarking-data` shareable

## Feature Description

Site Kit lets an administrator share a module with other roles, and those readers see the dashboard without connecting a Google account of their own: the reports run under the module owner's credentials. The Typical Traffic tab has to work that way too. Without this work a shared dashboard shows an error where the tab should be, so it is part of the tab rather than a follow-up to it.

This issue makes `GET:benchmarking-data` shareable and widens two allow-lists that would otherwise cut pieces out of a shared response.

**The first is the list of Analytics dimensions a shared report may query.** Six of the seven dimensions behind the factor sections are already on it; `sessionSource`, which produces the referrers section, is not. Because the reports are sent in batches, a dimension that is not on the list fails the whole batch rather than losing one section, so a shared reader would get the tab's error state rather than a tab with one section missing. Widening the list is the deliberate choice over dropping the referrers section on a shared request, which would make the response depend on which kind of user happened to load the dashboard first. A traffic-source name is the same kind of data as the channel grouping already on the list.

**The second is the list of Analytics settings a view-only dashboard receives.** The tab only appears for a property with at least thirteen months of history, and the dashboard reads the property's creation time to decide that. A view-only reader never receives that value today, so the condition could never pass for them and the gate would silently mean "authenticated users only". Adding `propertyCreateTime` to the shared settings keeps the history gate one condition, evaluated the same way for everyone.

That second change has a visible effect outside this tab, and it is a welcome one. The Traffic Overview chart marks the day the Analytics property was created, and draws nothing for a view-only reader because the value does not reach them — so a reader who can see the cliff in the line cannot see the explanation for it. Once the value is shared, the marker appears there too.

Both allow-list changes sit outside the `typicalTraffic` flag. They are single entries in lists the rest of the plugin reads on every request, and what a shared report may query should not depend on a feature flag. Neither is reachable by the tab with the flag off.

**Two view-only readers of the same dashboard can see different factor sections**, where one's role has Search Console shared and the other's does not. That is the correct outcome — a reader should not be shown rows they have no access to — and nothing pools one reader's response for another, because every stored copy of a response lives in the requesting reader's own browser.

The datapoint itself comes from #13594, and the search-query rows that a Search Console share decides the fate of come from #13596.

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* On a site where an administrator has shared Analytics with the Editor role, an editor who has not connected a Google account loads the main dashboard, selects the Typical Traffic tab and sees the same chart and factor sections an administrator sees, with the reports run under the Analytics owner's account.
* `sessionSource` is one of the dimensions a shared Analytics report may query, so the referrers section is present for that editor rather than the tab showing an error.
* `propertyCreateTime` is one of the Analytics settings a view-only dashboard receives, so the history gate on the Typical Traffic tab resolves for that editor and the tab appears for them on a property at least thirteen months old and not on a younger one.
* On the same shared dashboard, the Traffic Overview tab's chart shows the `Google Analytics property created` marker on the day the property was created, when that day falls inside the selected date range.
* Where the administrator has shared Analytics with the Editor role but not Search Console, that editor's Typical Traffic tab renders every section except search queries, and no error.
* Where the administrator has shared both Analytics and Search Console with the Editor role, that editor's Typical Traffic tab renders the search queries section.
* A reader who cannot view the Site Kit dashboard requesting `GET:benchmarking-data` receives HTTP `403`, and no report is run.
* The two allow-list additions apply whether or not `typicalTraffic` is enabled.
* Turning `typicalTraffic` off leaves a shared dashboard with the Traffic Overview widget it has today: one tab, the same panel and the same footer link.

## Implementation Brief

* [ ] <!-- One or more bullet points for how to technically implement the feature. Make sure to include changes to Storybook and visual regression tests where relevant. -->

### Test Coverage

* <!-- One or more bullet points for how to implement automated tests to verify the feature works. -->

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
