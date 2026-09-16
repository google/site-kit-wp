# Typical Traffic tab in the Traffic Overview widget, gated on thirteen months of property history

## Feature Description

The Traffic Overview widget on the main dashboard answers "how many visitors did I get, and where did they come from?" over the selected date range. What it cannot answer is whether that number is normal for this site. Most site owners have neither the analytics background nor the historical context to judge a 12% dip: without a sense of their own seasonality, a normal January decline reads as a crisis and a seasonal December rise reads as growth.

This issue adds the second tab the answer lives on. The widget already holds its tabs as a list and its selected tab in component state, so the work is one more entry in that list, one panel component behind it, and the rule that decides whether the entry is there at all. The chart and the factor sections that fill the panel are separate pieces of work.

**The tab appears only where the analysis makes sense.** Three conditions decide it: the `typicalTraffic` flag is on, the reader is on the main dashboard, and the Analytics property is at least thirteen months old. The entity dashboard renders the widget with the Traffic Overview tab alone — thirteen months of one page's traffic is a different question, dominated by that page's own publication date, and the tab's request has no page parameter to ask it with.

**The history condition gates the tab and not the widget, and that distinction matters.** The widget is the site's traffic card. A property connected last month needs its visitor total and its daily chart more than a mature one does, so putting a history requirement on the widget would take the whole card away from exactly the sites least able to spare it. A young property gets the widget with one tab, and the tab appears — with no notification, tour or badge — on the day the property is old enough to support it. A reader who wonders why their site has one tab and a colleague's has two is answered in support documentation rather than by an empty tab that explains its own absence.

**A tab that is not selected is not mounted**, so the tab's request is not sent until a reader selects it. The first selection shows a loading state and the second is instant, because the response is held in the browser for the hour. The more expensive of the two panels is paid for by the readers who open it.

The widget opens on Traffic Overview every time. Nothing remembers which tab a reader last used, which is how the widget behaves today.

The panel's contents come from #13600 and #13601, and its loading and error states from #13602. The tab's data is read through the slice in #13598.

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* On the main dashboard, with `typicalTraffic` enabled and an Analytics property at least thirteen months old, the Traffic Overview widget shows two tabs: `Traffic overview` first and `Typical traffic` second.
* `Traffic overview` is the selected tab when the dashboard loads, and it is the selected tab again after a page reload, whichever tab the reader last used.
* Selecting `Typical traffic` replaces the Traffic Overview panel with the Typical Traffic panel, and selecting `Traffic overview` puts it back.
* The Typical Traffic panel sends no request until a reader selects the tab: loading the dashboard and leaving `Traffic overview` selected issues no request to `GET:benchmarking-data`.
* The tab is present only when all of these hold; where any one does not, the widget shows the single `Traffic overview` tab, the same panel and the same footer link it shows today:
  * `typicalTraffic` is enabled.
  * The reader is on the main dashboard, whether they signed in with Google or are viewing a shared dashboard.
  * The Analytics property was created at least thirteen months before today.
* A property created exactly thirteen months ago shows the tab; a property created thirteen months ago less one day does not.
* The entity dashboard shows the `Traffic overview` tab alone, on a property of any age.
* Nothing announces the tab: a site whose property crosses thirteen months gains the second tab with no notification, tour step, badge or dismissible message anywhere in the dashboard.
* The Typical Traffic panel is a tab panel named by its tab, so a screen reader moving into it announces `Typical traffic`.

## Implementation Brief

* [ ] <!-- One or more bullet points for how to technically implement the feature. Make sure to include changes to Storybook and visual regression tests where relevant. -->

### Test Coverage

* <!-- One or more bullet points for how to implement automated tests to verify the feature works. -->

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
