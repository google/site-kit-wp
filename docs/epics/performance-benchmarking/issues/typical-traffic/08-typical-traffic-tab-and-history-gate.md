# Typical Traffic tab in the Traffic Overview widget, gated on thirteen months of property history

## Feature Description

The Traffic Overview widget on the main dashboard answers "how many visitors did I get, and where did they come from?" over the selected date range. What it cannot answer is whether that number is normal for this site. Most site owners have neither the analytics background nor the historical context to judge a 12% dip: without a sense of their own seasonality, a normal January decline reads as a crisis and a seasonal December rise reads as growth.

This issue adds the second tab the answer lives on. The widget already holds its tabs as a list and its selected tab in component state, so the work is one more entry in that list, one panel component behind it, and the rule that decides whether the entry is there at all. The chart and the factor sections that fill the panel are separate pieces of work.

**The tab appears only where the analysis makes sense.** Three conditions decide it: the `typicalTraffic` flag is on, the reader is on the main dashboard, and the Analytics property is at least thirteen months old. The entity dashboard renders the widget with the Traffic Overview tab alone — thirteen months of one page's traffic is a different question, dominated by that page's own publication date, and the tab's request has no page parameter to ask it with.

**The history condition gates the tab and not the widget, and that distinction matters.** The widget is the site's traffic card. A property connected last month needs its visitor total and its daily chart more than a mature one does, so putting a history requirement on the widget would take the whole card away from exactly the sites least able to spare it. A young property gets the widget with one tab, and the tab appears — with no notification, tour or badge — on the day the property is old enough to support it. A reader who wonders why their site has one tab and a colleague's has two is answered in support documentation rather than by an empty tab that explains its own absence.

**A tab that is not selected is not mounted**, so the tab's request is not sent until a reader selects it. The first selection shows a loading state and the second is instant, because the response is held in the browser for the hour. The more expensive of the two panels is paid for by the readers who open it.

The widget opens on Traffic Overview every time. Nothing remembers which tab a reader last used, which is how the widget behaves today.

The panel's contents come from #13600 and #13601, and its loading and error states from #13602. The tab's data is read through the slice in #13598.

Link to the design doc: https://docs.google.com/document/d/1dsEs6-NjlP_LNqz5md5fnJMuxh9Vd9f88w4DTrZdLok/edit?tab=t.y7e2u5h52vf1

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

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/constants.ts`:
  * Add `TYPICAL_TRAFFIC_TAB_ID`, set to `googlesitekit-typical-traffic-tab`, following `TRAFFIC_OVERVIEW_TAB_ID`.
  * Add `TYPICAL_TRAFFIC_MINIMUM_PROPERTY_AGE_MONTHS`, set to `13`.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/utils/getTypicalTrafficEligibilityDate.ts` (new file):
  * Export `getTypicalTrafficEligibilityDate( referenceDate: string ): string`, returning the day `TYPICAL_TRAFFIC_MINIMUM_PROPERTY_AGE_MONTHS` calendar months before `referenceDate`, as `YYYY-MM-DD`.
  * Subtract the months from the year and month, then clamp the day to the last day of the month it lands in, rather than calling `setMonth()` on a `Date` — `setMonth()` rolls `2026-03-31` back to early March instead of the end of February.
  * Build and read the date with `stringToDate` and `getDateString` from `@/js/util`, so no local time zone moves the day.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/hooks/useHasTypicalTrafficTab.ts` (new file):
  * Export `useHasTypicalTrafficTab(): boolean`, returning `true` only when all three hold: `useFeature( 'typicalTraffic' )` is `true`; `useViewContext()` is `VIEW_CONTEXT_MAIN_DASHBOARD` or `VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY`; and the property's creation day is on or before `getTypicalTrafficEligibilityDate( getReferenceDate() )`.
  * Read the creation time with `select( MODULES_ANALYTICS_4 ).getPropertyCreateTime()` and the reference day with `select( CORE_USER ).getReferenceDate()`. Turn the creation time into a `YYYY-MM-DD` day the way `TrafficChart` does, then compare the two day strings directly.
  * Return `false` while `getPropertyCreateTime()` is `undefined`, so the tab appears once rather than appearing and disappearing while the settings resolve.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/tabs/TypicalTrafficPanel.tsx` (new file):
  * Render a `div` with the class `googlesitekit-traffic-overview__panel`, `role="tabpanel"` and `aria-labelledby={ TYPICAL_TRAFFIC_TAB_ID }`, following `TrafficOverviewPanel`.
  * Call `useBenchmarkingData()` and pass its values down. The panel is the only part of the tab that touches the data store.
  * The chart is #13600, the factor blocks are #13601, and the loading and error states are #13602. This issue renders the panel and its request and nothing inside it.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/hooks/useBenchmarkingData.ts` (new file):
  * Export `useBenchmarkingData()`, reading `startDate` and `endDate` from `select( CORE_USER ).getDateRangeDates()` and returning `{ response, loading, error }` from `getBenchmarkingData( startDate, endDate )`, `isLoadingBenchmarkingData( startDate, endDate )` and `getErrorForSelector( 'getBenchmarkingData', [ startDate, endDate ] )` on `MODULES_ANALYTICS_4`, following `useTrafficOverviewReports`.
  * Return `startDate` and `endDate` as well, so the panel can pass them to `clearBenchmarkingData` in #13602.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/widgets/TrafficOverviewWidget.tsx`:
  * Replace the module-level `TABS` constant with a list built inside the component with `useMemo`: the Traffic Overview descriptor always, and the Typical Traffic descriptor after it when `useHasTypicalTrafficTab()` is `true`. Its `label` is `Typical traffic`, its `id` is `TYPICAL_TRAFFIC_TAB_ID`, and its `PanelComponent` is `TypicalTrafficPanel`.
  * Leave the active-tab state as it is: it starts at `TRAFFIC_OVERVIEW_TAB_ID` on every mount, nothing persists a reader's choice, and the existing `?? TABS[ 0 ]` fallback covers a selected tab that leaves the list.
  * Leave the footer as it is. The widget keeps `TrafficOverviewSourceLink` on both tabs.
  * Only the selected tab's panel is rendered, which is what keeps `GET:benchmarking-data` unsent until a reader selects the tab. Do not render both panels and hide one.
  * Add no notification, tour step, badge or dismissible message anywhere for the new tab.

* [ ] In `assets/sass/widgets/_googlesitekit-widget-analyticsTrafficOverview.scss`:
  * Add the styles the Typical Traffic panel needs, per the design, beside the existing `.googlesitekit-traffic-overview__panel` rules. The file is already imported from `assets/sass/admin.scss`.

### Test Coverage

* Add `assets/js/modules/analytics-4/components/traffic-overview/utils/getTypicalTrafficEligibilityDate.test.ts` covering:
  * A reference day in the middle of a month returns the same day thirteen months earlier.
  * A reference day of `2026-03-31` returns `2025-02-28`, and `2028-03-31` returns `2027-02-28`, rather than rolling into March.
  * A reference day in January returns a day in the previous year's December.
* Add `assets/js/modules/analytics-4/components/traffic-overview/hooks/useHasTypicalTrafficTab.test.ts` covering:
  * `true` with the feature on, the main dashboard view context and a property older than thirteen months.
  * `false` with the feature off, `false` on the entity dashboard, and `false` on a property younger than thirteen months.
  * `true` on the view-only main dashboard when the shared settings carry the creation time.
  * `true` for a property created exactly thirteen months before the reference date, and `false` for one created thirteen months ago less one day.
  * `false` while the creation time is `undefined`.
* Extend `assets/js/modules/analytics-4/components/traffic-overview/widgets/TrafficOverviewWidget.test.tsx` covering:
  * Both tabs render in order, `Traffic overview` first, when the gate passes, and `Traffic overview` is selected on mount.
  * Selecting `Typical traffic` swaps in the Typical Traffic panel, and selecting `Traffic overview` swaps it back.
  * With `Traffic overview` selected, no request to `GET:benchmarking-data` is made.
  * The panel is a `tabpanel` whose `aria-labelledby` points at the Typical Traffic tab, so a screen reader announces `Typical traffic`.
  * Where the gate does not pass, the widget renders one tab, the Traffic Overview panel and the same footer link.
* Add `assets/js/modules/analytics-4/components/traffic-overview/hooks/useBenchmarkingData.test.ts` covering:
  * The hook requests the selected range's two dates and returns the decoded response, the loading flag and the error.
* Extend `assets/js/modules/analytics-4/components/traffic-overview/widgets/TrafficOverviewWidget.stories.tsx` with a `Typical Traffic` story: the gate passing, `provideBenchmarkingData` seeding the response, and the second tab selected. Give it a `scenario` with a `readySelector`, as `MainDashboard` has.
* The new story adds a Backstop scenario and needs a new reference image. The existing `Main Dashboard` and `Entity Dashboard` references do not move, because neither shows the second tab.

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
